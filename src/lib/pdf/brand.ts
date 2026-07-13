import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Brand assets for the server-side PDF pipeline: the SaharaBase logo, the house palette, and the
 * brand typefaces (Sora for display, General Sans for text) registered with @react-pdf/renderer.
 *
 * react-pdf only accepts static TTF/WOFF (no woff2, no variable fonts), so the weights we use are
 * bundled under ./fonts. Registration is idempotent and lazy — call registerBrandFonts() before
 * rendering. Files are read from the source tree via process.cwd() (present under `next start`).
 */

const FONT_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");
const BRAND_DIR = path.join(process.cwd(), "public/brand");

/** House palette — monochrome ink/paper, matching the marketing site + document engine. */
export const brand = {
  ink: "#0a0a0a", // --color-primary
  body: "#374151", // gray-700, body copy
  muted: "#6b7280", // gray-500, labels/detail
  faint: "#9ca3af", // gray-400
  line: "#e5e7eb", // gray-200, borders
  hair: "#f3f4f6", // gray-100, subtle dividers
  panel: "#fafafa", // near-paper fill
  danger: "#b91c1c",
  warn: "#b45309",
  ok: "#3f6212",
} as const;

let fontsRegistered = false;

export function registerBrandFonts(): void {
  if (fontsRegistered) return;

  Font.register({
    family: "Sora",
    fonts: [
      { src: path.join(FONT_DIR, "sora-400.woff"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "sora-600.woff"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "sora-700.woff"), fontWeight: 700 },
    ],
  });

  Font.register({
    family: "GeneralSans",
    fonts: [
      { src: path.join(FONT_DIR, "GeneralSans-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "GeneralSans-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONT_DIR, "GeneralSans-Semibold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "GeneralSans-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // Keep words intact — the default hyphenation splits identifiers/URLs awkwardly.
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}

let logoCache: string | null = null;

/** The black wordmark as a data URI (497×107), for the PDF header. */
export function logoDataUri(): string {
  if (logoCache) return logoCache;
  const buf = fs.readFileSync(path.join(BRAND_DIR, "logo-black.png"));
  logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  return logoCache;
}

export const LOGO_ASPECT = 497 / 107;
