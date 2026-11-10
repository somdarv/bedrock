"use client";

import * as React from "react";
import type { BoardMark } from "@/lib/api";
import { absPoints, arrowHead, fromRuns, runs, smoothPath, type Run } from "@/lib/boards/marks";

/**
 * How each drawing looks, in board pixels inside the canvas's moving layer (docs/BOARDS.md).
 * Text and notes are edited in place, in a box that shows bold as bold: select words and press
 * Ctrl B, or the B on the bar above. Their words are kept with **two stars** round what is bold.
 */
export const MarkView = React.memo(function MarkView({
  mark,
  editing,
  onEdited,
}: {
  mark: BoardMark;
  editing: boolean;
  /** Called once when editing ends, with the words, the height they take and the text size. */
  onEdited: (text: string, height: number, fontSize: number) => void;
}) {
  const m = mark;
  const stroke = m.stroke ?? 2;

  if (m.kind === "frame") {
    return (
      <div
        className="absolute bg-white"
        style={{ left: m.x, top: m.y, width: m.w, height: m.h, boxShadow: `0 0 0 ${Math.max(1, stroke / 2)}px rgba(0,0,0,0.08)` }}
      />
    );
  }

  if (m.kind === "note" || m.kind === "text") {
    const size = m.fontSize ?? 20;
    const note = m.kind === "note";
    const box: React.CSSProperties = {
      left: m.x,
      top: m.y,
      width: m.w,
      minHeight: note ? m.h : undefined,
      height: note ? m.h : undefined,
      fontSize: size,
      lineHeight: 1.35,
      padding: note ? size * 0.8 : 0,
      color: note ? "#1e1e1e" : m.color,
      background: note ? m.color : "transparent",
      boxShadow: note ? `0 ${size * 0.15}px ${size * 0.6}px rgba(0,0,0,0.12)` : undefined,
    };
    return editing ? (
      <EditText mark={m} style={box} onDone={onEdited} />
    ) : (
      <div className="absolute overflow-hidden whitespace-pre-wrap break-words" style={box}>
        <RichText text={m.text ?? ""} />
      </div>
    );
  }

  const pts = absPoints(m).map(([x, y]) => [x - m.x, y - m.y] as [number, number]);
  const common = {
    fill: "none",
    stroke: m.color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      className="absolute overflow-visible"
      style={{ left: m.x, top: m.y, width: Math.max(1, m.w), height: Math.max(1, m.h) }}
      aria-hidden
    >
      {m.kind === "rect" ? <rect x={0} y={0} width={m.w} height={m.h} {...common} /> : null}
      {m.kind === "oval" ? <ellipse cx={m.w / 2} cy={m.h / 2} rx={m.w / 2} ry={m.h / 2} {...common} /> : null}
      {m.kind === "pencil" ? <path d={smoothPath(pts)} {...common} /> : null}
      {m.kind === "pen" ? <polyline points={pts.map((p) => p.join(",")).join(" ")} {...common} /> : null}
      {m.kind === "line" && pts.length >= 2 ? <line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} {...common} /> : null}
      {m.kind === "arrow" && pts.length >= 2 ? <Arrow tail={pts[0]} tip={pts[pts.length - 1]} head={arrowHead(m)} {...common} /> : null}
    </svg>
  );
});

/** Words with their bold. React escapes every word, so nothing typed can become markup. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {runs(text).map((r, i) =>
        r.bold ? (
          <strong key={i} className="font-bold">
            {r.text}
          </strong>
        ) : (
          <React.Fragment key={i}>{r.text}</React.Fragment>
        ),
      )}
    </>
  );
}

function Arrow({
  tail,
  tip,
  head,
  ...common
}: { tail: [number, number]; tip: [number, number]; head: number } & Omit<React.SVGProps<SVGPathElement>, "from" | "to">) {
  const angle = Math.atan2(tip[1] - tail[1], tip[0] - tail[0]);
  const wing = (a: number) => [tip[0] - head * Math.cos(angle + a), tip[1] - head * Math.sin(angle + a)];
  const [ax, ay] = wing(Math.PI / 7);
  const [bx, by] = wing(-Math.PI / 7);
  return (
    <>
      <line x1={tail[0]} y1={tail[1]} x2={tip[0]} y2={tip[1]} {...(common as React.SVGProps<SVGLineElement>)} />
      <path d={`M${ax} ${ay} L${tip[0]} ${tip[1]} L${bx} ${by}`} {...common} />
    </>
  );
}

/** The event the format bar sends to the box being typed in. */
export type FormatEvent = CustomEvent<{ size: number }>;
export const FORMAT_EVENT = "board-format";

/**
 * Words being typed into a text or a note. Leaving the box, Escape or Ctrl Enter ends it. The
 * box is filled once from the words and read back once at the end; React does not own what is
 * inside it while it is open.
 */
function EditText({
  mark,
  style,
  onDone,
}: {
  mark: BoardMark;
  style: React.CSSProperties;
  onDone: (text: string, height: number, fontSize: number) => void;
}) {
  const box = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState(mark.fontSize ?? 20);
  const sizeRef = React.useRef(size);
  sizeRef.current = size;
  const done = React.useRef(false);

  const finish = React.useCallback(() => {
    const el = box.current;
    if (done.current || !el) return;
    done.current = true;
    onDone(toMarkdown(el).replace(/\s+$/, ""), el.scrollHeight, sizeRef.current);
  }, [onDone]);

  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.replaceChildren(...toNodes(mark.text ?? ""));
    // Focus without letting the browser scroll the canvas to show the box.
    el.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const onFormat = (e: Event) => setSize((e as FormatEvent).detail.size);
    el.addEventListener(FORMAT_EVENT, onFormat);
    // Editing ends on blur alone. The canvas blurs the box before it acts on any press, so the
    // words are read back before the box goes.
    return () => el.removeEventListener(FORMAT_EVENT, onFormat);
    // Filled once, when editing starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={box}
      data-float
      data-editing
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      aria-label={mark.kind === "note" ? "Note" : "Text"}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          box.current?.blur();
        }
      }}
      onPaste={(e) => {
        // Pasted words come in plain, never as someone else's markup.
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute cursor-text whitespace-pre-wrap break-words outline-none"
      style={{ ...style, height: undefined, fontSize: size, padding: mark.kind === "note" ? size * 0.8 : 0 }}
    />
  );
}

/** The words as nodes for the box: bold in <b>, lines split by <br>. Never parsed as markup. */
function toNodes(text: string): Node[] {
  const out: Node[] = [];
  for (const r of runs(text)) {
    r.text.split("\n").forEach((part, i) => {
      if (i > 0) out.push(document.createElement("br"));
      if (!part) return;
      const t = document.createTextNode(part);
      if (r.bold) {
        const b = document.createElement("b");
        b.appendChild(t);
        out.push(b);
      } else out.push(t);
    });
  }
  return out;
}

/** The box read back as words with **two stars** round what is bold. */
function toMarkdown(root: HTMLElement): string {
  const rs: Run[] = [];
  const push = (text: string, bold: boolean) => {
    const last = rs[rs.length - 1];
    if (last && last.bold === bold) last.text += text;
    else rs.push({ text, bold });
  };
  const ends = () => rs.map((r) => r.text).join("");
  const walk = (node: Node, bold: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) push(node.textContent, bold);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      push("\n", false);
      return;
    }
    const block = node.tagName === "DIV" || node.tagName === "P";
    if (block && ends() && !ends().endsWith("\n")) push("\n", false);
    const weight = node.style.fontWeight;
    const b = bold || node.tagName === "B" || node.tagName === "STRONG" || weight === "bold" || Number(weight) >= 600;
    node.childNodes.forEach((c) => walk(c, b));
  };
  root.childNodes.forEach((c) => walk(c, false));
  return fromRuns(rs);
}
