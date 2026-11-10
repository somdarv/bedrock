// Turn a Claude Design canvas (project/canvas.json + *.dc.html) into a hub board folder
// (board.json + plain pages), as docs/BOARDS.md describes. Usage:
//   node scripts/canvas-to-board.cjs <canvas folder holding project/> <folder of the canvas images, <id>.jpg> <out folder>
// "today" artboards (prod beside beta) become the beta half alone; the rest are rendered by
// running each artboard's renderVals() and expanding sc-for, sc-if and {{holes}}.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const [, , canvasDir, assetsDir, outDir] = process.argv;
const project = path.join(canvasDir, "project");
const canvas = JSON.parse(fs.readFileSync(path.join(project, "canvas.json"), "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function resolve(expr, scope) {
  const m = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(expr.trim());
  const p = m ? m[1] : expr.trim();
  if (p === "true") return true;
  if (p === "false") return false;
  return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), scope);
}

const fill = (s, scope) => s.replace(/\{\{\s*([A-Za-z_$][\w$.]*)\s*\}\}/g, (_, p) => esc(resolve(p, scope)));

function attr(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

/** Expand the first sc-for or sc-if, then the rest; fill holes in the plain text between. */
function expand(src, scope) {
  const at = src.search(/<sc-(for|if)\b/);
  if (at < 0) return fill(src, scope);
  const kind = src.slice(at + 4, at + 7) === "for" ? "for" : "if";
  const openEnd = src.indexOf(">", at) + 1;
  const tag = src.slice(at, openEnd);
  // Find the matching close, counting nested tags of the same kind.
  const openRe = new RegExp(`<sc-${kind}\\b`, "g");
  const closeTag = `</sc-${kind}>`;
  let depth = 1;
  let i = openEnd;
  while (depth > 0) {
    openRe.lastIndex = i;
    const nextOpen = openRe.exec(src);
    const nextClose = src.indexOf(closeTag, i);
    if (nextClose < 0) throw new Error(`no ${closeTag}`);
    if (nextOpen && nextOpen.index < nextClose) {
      depth++;
      i = nextOpen.index + 4;
    } else {
      depth--;
      i = nextClose + closeTag.length;
    }
  }
  const inner = src.slice(openEnd, i - closeTag.length);
  let out = "";
  if (kind === "for") {
    const list = resolve(attr(tag, "list"), scope) ?? [];
    const as = attr(tag, "as");
    for (const item of list) out += expand(inner, { ...scope, [as]: item });
  } else if (resolve(attr(tag, "value"), scope)) {
    out = expand(inner, scope);
  }
  return fill(src.slice(0, at), scope) + out + expand(src.slice(i), scope);
}

function render(file) {
  const src = fs.readFileSync(path.join(project, file), "utf8");
  const title = (/<title>([\s\S]*?)<\/title>/.exec(src) || [])[1] || file;
  const helmet = (/<helmet>([\s\S]*?)<\/helmet>/.exec(src) || [])[1] || "";
  let body = (/<x-dc>([\s\S]*?)<\/x-dc>/.exec(src) || [])[1] || "";
  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/, "");
  const script = (/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(src) || [])[1] || "";
  const propsJson = (/data-props='([^']*)'/.exec(src) || [])[1] || "{}";
  const props = {};
  for (const [k, v] of Object.entries(JSON.parse(propsJson))) if (!k.startsWith("$") && v && "default" in v) props[k] = v.default;
  const ctx = { props, result: null };
  vm.createContext(ctx);
  vm.runInContext(
    `class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } }\n${script}\nresult = new Component(props).renderVals();`,
    ctx,
    { timeout: 2000 },
  );
  const scope = { ...props, ...(ctx.result || {}) };
  return { title, html: page(title, helmet, expand(body, scope)) };
}

const page = (title, head, body) =>
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${esc(title)}</title>\n${head.trim()}\n</head>\n<body>\n${body.trim()}\n</body>\n</html>\n`;

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

/** The beta half of a "today" artboard, its screenshot written into the page. */
function betaHalf(file) {
  const src = fs.readFileSync(path.join(project, file), "utf8");
  const fig = /<figure[^>]*>\s*<figcaption[^>]*>Beta[^<]*<\/figcaption>([\s\S]*?)<\/figure>/.exec(src);
  if (!fig) throw new Error(`no beta figure in ${file}`);
  const helmet = (/<helmet>([\s\S]*?)<\/helmet>/.exec(src) || [])[1] || "";
  let size = null;
  const inner = fig[1].replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => {
    const buf = fs.readFileSync(path.join(assetsDir, `${id}.jpg`));
    size = size || jpegSize(buf);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  });
  const h = size ? Math.round((1280 * size.h) / size.w) : 900;
  const body = `<div style="position: relative; width: 1280px; height: ${h}px; overflow: hidden; background: #EDF0F4">${inner.trim()}</div>`;
  return { h, html: page("Beta today", helmet, body) };
}

const board = {
  title: canvas.title || "Board",
  forName: null,
  pages: canvas.pages,
  notes: [],
  frames: [],
};

for (const n of Object.values(canvas.notes || {})) {
  if (n.kind === "title1") board.notes.push({ kind: "title", x: n.x, y: n.y, text: n.text, page: n.page ?? null });
  else if (!n.kind) board.notes.push({ kind: "sticky", x: n.x, y: n.y, w: n.w ?? 400, size: n.size ?? 24, text: n.text, page: n.page ?? null });
}

for (const file of canvas.order) {
  const b = canvas.boards[file];
  const key = file.replace(/\.dc\.html$/, "");
  let out;
  if (/-today\.dc\.html$/.test(file)) {
    const beta = betaHalf(file);
    out = {
      key: `${key.replace(/-today$/, "")}-beta.html`,
      title: (b.title || key).replace(/:\s*prod, then beta$/i, ": beta today"),
      page: b.page,
      x: b.x + 1360,
      y: b.y + 52,
      w: 1280,
      h: beta.h,
      html: beta.html,
    };
  } else {
    const r = render(file);
    out = { key: `${key}.html`, title: b.title || r.title, page: b.page, x: b.x, y: b.y, w: b.w, h: b.h, html: r.html };
  }
  fs.writeFileSync(path.join(outDir, out.key), out.html);
  const { html, key: k, ...rest } = out;
  board.frames.push({ file: k, ...rest });
  if (/\{\{|<sc-/.test(html)) console.warn(`left over template in ${k}`);
}

fs.writeFileSync(path.join(outDir, "board.json"), JSON.stringify(board, null, 1));
const total = board.frames.reduce((n, f) => n + fs.statSync(path.join(outDir, f.file)).size, 0);
console.log(`${board.frames.length} frames, ${board.notes.length} notes, ${(total / 1024 / 1024).toFixed(1)} MB`);
