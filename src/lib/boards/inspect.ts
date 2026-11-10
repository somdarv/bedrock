import type { BoardFrame } from "@/lib/api";
import type { Rect } from "./marks";

/**
 * Finding the block under the pointer inside a frame, as the Claude canvas does: a click picks
 * the outermost block there, a double click goes one level in (docs/BOARDS.md).
 *
 * A frame's page is served from the hub with `sandbox allow-same-origin` and no scripts, so the
 * board can read its layout but the page can run nothing. The board never changes it.
 */

export type Block = { rect: Rect; path: string; label: string };

function docOf(frameId: string): Document | null {
  const el = document.querySelector<HTMLIFrameElement>(`iframe[data-frame="${CSS.escape(frameId)}"]`);
  try {
    const doc = el?.contentDocument;
    return doc && doc.body && doc.readyState !== "loading" ? doc : null;
  } catch {
    // Not readable: an older page served before the frames could be read. Fall back to the frame.
    return null;
  }
}

/**
 * The blocks under a point on the frame, outermost first. A block that fills the frame (a page
 * wrapper) is skipped, and so is anything with no size.
 */
export function blocksAt(frame: BoardFrame, x: number, y: number): Element[] {
  const doc = docOf(frame.id);
  if (!doc) return [];
  const hit = doc.elementFromPoint(x, y);
  if (!hit) return [];
  const chain: Element[] = [];
  for (let el: Element | null = hit; el && el !== doc.body && el !== doc.documentElement; el = el.parentElement) {
    chain.unshift(el);
  }
  return chain.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    return !(r.width >= frame.w * 0.97 && r.height >= frame.h * 0.97);
  });
}

/** The block at a depth under the point, the deepest there is when the depth runs past it. */
export function blockAt(frame: BoardFrame, x: number, y: number, depth: number): { block: Block; depth: number } | null {
  const chain = blocksAt(frame, x, y);
  if (chain.length === 0) return null;
  const d = Math.max(0, Math.min(depth, chain.length - 1));
  return { block: describe(chain[d]), depth: d };
}

export function describe(el: Element): Block {
  const r = el.getBoundingClientRect();
  return {
    rect: { x: r.left, y: r.top, w: r.width, h: r.height },
    path: pathOf(el),
    label: labelOf(el),
  };
}

/** A CSS path from the body, so a reader of the comment can find the block in the page. */
function pathOf(el: Element): string {
  const parts: string[] = [];
  for (let node: Element | null = el; node && node.tagName !== "BODY" && node.tagName !== "HTML"; node = node.parentElement) {
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    const same = parent ? Array.from(parent.children).filter((c) => c.tagName === node!.tagName) : [];
    parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag);
  }
  return ["body", ...parts].join(" > ").slice(0, 500);
}

/** A few words of the block, or what it is when it has no words. */
function labelOf(el: Element): string {
  // The words as laid out, so two lines read as two words apart, not run together.
  const shown = (el as HTMLElement).innerText ?? el.textContent ?? "";
  const words = shown.replace(/\s+/g, " ").trim();
  if (words) return words.slice(0, 120);
  const alt = el.getAttribute("alt") || el.getAttribute("aria-label");
  return alt ? alt.slice(0, 120) : el.tagName.toLowerCase();
}
