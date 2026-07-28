/**
 * Verifies src/lib/vault/totp.ts against the RFC 6238 SHA-1 test vectors.
 *
 * The real source is read from disk, its TS-only syntax stripped, and executed, so this checks
 * the shipped implementation rather than a copy that could drift from it.
 */
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

globalThis.window = { crypto: webcrypto };

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(REPO, "src", "lib", "vault", "totp.ts"), "utf8");

// Strip the "use client" pragma and the handful of type annotations this file uses.
const js = source
  .replace(/^"use client";/m, "")
  .replace(/: Uint8Array\b/g, "")
  .replace(/: string\b/g, "")
  .replace(/: number = Date\.now\(\)/g, " = Date.now()")
  .replace(/: number\b/g, "")
  .replace(/: boolean\b/g, "")
  .replace(/: Promise<[^>]+>/g, "")
  .replace(/ as BufferSource/g, "");

const module = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

// RFC 6238 Appendix B, SHA-1 rows. The published codes are 8 digits; a 6-digit TOTP is the
// same truncation taken modulo 10^6, which is the last six digits.
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // base32 of "12345678901234567890"
const VECTORS = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
  [20000000000, "353130"],
];

let failures = 0;

for (const [seconds, expected] of VECTORS) {
  const actual = await module.generateTotp(SECRET, seconds * 1000);
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  T=${seconds}  expected ${expected}  got ${actual}`);
}

// Base32 decoding of a known value, and the otpauth:// extraction path.
const decoded = Buffer.from(module.base32Decode(SECRET)).toString("utf8");
const decodeOk = decoded === "12345678901234567890";
if (!decodeOk) failures += 1;
console.log(`${decodeOk ? "PASS" : "FAIL"}  base32Decode -> "${decoded}"`);

const uri = "otpauth://totp/Namecheap:me@example.com?secret=jbswy3dpehpk3pxp&issuer=Namecheap";
const parsed = module.normaliseTotpInput(uri);
const uriOk = parsed === "JBSWY3DPEHPK3PXP";
if (!uriOk) failures += 1;
console.log(`${uriOk ? "PASS" : "FAIL"}  otpauth URI -> "${parsed}"`);

const spaced = module.normaliseTotpInput("jbsw y3dp ehpk 3pxp");
const spacedOk = spaced === "JBSWY3DPEHPK3PXP";
if (!spacedOk) failures += 1;
console.log(`${spacedOk ? "PASS" : "FAIL"}  spaced seed -> "${spaced}"`);

const rejects = !module.isValidTotpSecret("not-base32-at-all!!");
if (!rejects) failures += 1;
console.log(`${rejects ? "PASS" : "FAIL"}  rejects invalid base32`);

console.log(failures === 0 ? "\nAll TOTP checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
