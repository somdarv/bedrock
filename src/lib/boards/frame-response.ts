/**
 * A frame's page, as the hub serves it to the board (docs/BOARDS.md). We wrote the page, but it
 * is still shown as if a stranger had: the board puts it in a frame with `sandbox` set and only
 * `allow-same-origin`, and this header says the same to a browser that opens the address on its
 * own. No script runs, nothing can be sent anywhere, and only the hub may frame it.
 *
 * `allow-same-origin` lets the board read the page's layout to find the block under the pointer
 * (lib/boards/inspect.ts). It is safe only because scripts stay off: never add `allow-scripts`
 * beside it, or a page could reach the hub as the person viewing it.
 *
 * Pictures may come from anywhere over https or be written into the page. Styles and fonts may
 * come from Google Fonts. Everything else is refused.
 */
const FRAME_POLICY = [
  "sandbox allow-same-origin",
  "default-src 'none'",
  "img-src data: blob: https:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src data: https://fonts.gstatic.com",
  "frame-ancestors 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export function framePage(html: string): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": FRAME_POLICY,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      // The address carries the frame's version, so a redrawn frame is a new address.
      "Cache-Control": "private, max-age=300",
    },
  });
}

export function frameMissing(): Response {
  return new Response("This drawing is not on the board.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
  });
}
