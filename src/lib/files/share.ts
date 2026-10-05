/**
 * Small pieces the share dialog, the file browser and the Files overview all need: where a link
 * lives, how it gets onto the clipboard, and how its dates read.
 */

/** The address a share link opens at, on whichever hub the operator is using. */
export function shareUrl(token: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/s/${token}`;
}

/**
 * Put text on the clipboard, including text still on its way from the server. Safari only lets a
 * page write to the clipboard inside the press that asked for it, so a link that is being made
 * goes in as a promise the browser waits on. Where that is refused, the plain write follows.
 */
export async function copyText(text: string | Promise<string>): Promise<void> {
  const pending = Promise.resolve(text);
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": pending.then((t) => new Blob([t], { type: "text/plain" })) }),
      ]);
      return;
    } catch {
      // An older engine that will not take a promise. The write below covers it.
    }
  }
  await navigator.clipboard.writeText(await pending);
}

/** "today at 14:05", "12 Sep", or "12 Sep 2025". */
export function whenText(iso: string, now = new Date()) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `today at ${time}`;
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
  return `${date} at ${time}`;
}

export function hasEnded(expiresAt: string | null, now = new Date()) {
  return expiresAt !== null && new Date(expiresAt) <= now;
}

/** An end date this many days from now, for the "Link ends" choice. */
export function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
