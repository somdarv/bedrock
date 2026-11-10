"use client";

import * as React from "react";
import type { BoardMark } from "@/lib/api";
import { absPoints, arrowHead, smoothPath } from "@/lib/boards/marks";

/**
 * How each drawing looks, in board pixels inside the canvas's moving layer (docs/BOARDS.md).
 * Text and notes are edited in place: the words become a text box of the same size and face.
 */
export const MarkView = React.memo(function MarkView({
  mark,
  editing,
  onEdited,
}: {
  mark: BoardMark;
  editing: boolean;
  /** Called once when editing ends, with the words and the height they now take. */
  onEdited: (text: string, height: number) => void;
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
        {m.text || (note ? "" : " ")}
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

/** Words being typed into a text or a note. Leaving the box, or Escape, ends it. */
function EditText({
  mark,
  style,
  onDone,
}: {
  mark: BoardMark;
  style: React.CSSProperties;
  onDone: (text: string, height: number) => void;
}) {
  const [text, setText] = React.useState(mark.text ?? "");
  const area = React.useRef<HTMLTextAreaElement>(null);
  const done = React.useRef(false);

  React.useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, mark.kind === "note" ? mark.h : 0)}px`;
  }, [text, mark.kind, mark.h]);

  React.useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone(text, area.current?.scrollHeight ?? mark.h);
  };

  return (
    <textarea
      ref={area}
      data-float
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          finish();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={mark.kind === "note" ? "Note" : "Text"}
      className="pointer-events-auto absolute resize-none overflow-hidden border-0 outline-none"
      style={{ ...style, height: undefined, font: "inherit", fontSize: style.fontSize, lineHeight: style.lineHeight }}
    />
  );
}
