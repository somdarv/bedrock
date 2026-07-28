"use client";

/**
 * TOTP code generation (RFC 6238) in the browser, so the vault can stand in for an
 * authenticator app on the accounts whose seeds it holds.
 *
 * HMAC-SHA1 is the algorithm here because that is what the standard specifies and what every
 * issuer implements. Its weaknesses as a hash do not apply to this construction: the code is
 * six digits, valid for thirty seconds, and derived from a secret the attacker would already
 * need to hold. Using SHA-256 instead would simply produce codes the issuer rejects.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;

/** RFC 4648 base32, tolerant of the spacing and padding issuers print under their QR codes. */
export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  if (!clean) throw new Error("The TOTP secret is empty.");

  const out = new Uint8Array(Math.floor((clean.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let index = 0;

  for (const char of clean) {
    const digit = BASE32_ALPHABET.indexOf(char);
    if (digit === -1) throw new Error(`"${char}" is not valid base32.`);

    value = (value << 5) | digit;
    bits += 5;

    if (bits >= 8) {
      out[index] = (value >>> (bits - 8)) & 0xff;
      index += 1;
      bits -= 8;
    }
  }

  return out.subarray(0, index);
}

/** True if the string decodes and is long enough to be a real seed. */
export function isValidTotpSecret(secret: string): boolean {
  try {
    return base32Decode(secret).length >= 10;
  } catch {
    return false;
  }
}

/**
 * Issuers hand out either a bare base32 seed or a whole `otpauth://` URI. Accept both, so the
 * seed field works no matter which one gets pasted in.
 */
export function normaliseTotpInput(raw: string): string {
  const trimmed = raw.trim();

  if (/^otpauth:\/\//i.test(trimmed)) {
    try {
      const secret = new URL(trimmed).searchParams.get("secret");
      if (secret) return secret.replace(/\s+/g, "").toUpperCase();
    } catch {
      // Not a parseable URI; fall through and treat it as a raw seed.
    }
  }

  return trimmed.replace(/\s+/g, "").toUpperCase();
}

/** The current code for a seed. Throws if the seed is not decodable base32. */
export async function generateTotp(secret: string, at: number = Date.now()): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    base32Decode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const counter = Math.floor(at / 1000 / TOTP_PERIOD);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  // 64-bit big-endian counter, written as two 32-bit halves because JS bitwise ops are 32-bit.
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const signature = new Uint8Array(await window.crypto.subtle.sign("HMAC", key, buffer));

  // Dynamic truncation, RFC 4226 §5.3.
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    (signature[offset + 1] << 16) |
    (signature[offset + 2] << 8) |
    signature[offset + 3];

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

/** Seconds left before the current code rolls over. */
export function secondsRemaining(at: number = Date.now()): number {
  return TOTP_PERIOD - (Math.floor(at / 1000) % TOTP_PERIOD);
}
