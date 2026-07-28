"use client";

/**
 * Password generation and strength scoring for stored site passwords.
 *
 * This is separate from `checkPassphrase` in crypto.ts on purpose. The master passphrase has to
 * be memorised, so it is judged on length and word count. A site password never gets typed from
 * memory, so it is judged on entropy and should simply be generated.
 */

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

/** Ambiguous glyphs (l, I, 1, O, 0) are excluded above so a code read aloud is unambiguous. */
export interface GeneratorOptions {
  length: number;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

export const DEFAULT_GENERATOR: GeneratorOptions = {
  length: 20,
  upper: true,
  digits: true,
  symbols: true,
};

/**
 * A uniformly random index into an alphabet.
 *
 * Rejection sampling rather than `% alphabet.length`: the modulo of a uniform byte is biased
 * toward the low characters whenever 256 is not a multiple of the alphabet size, which quietly
 * shrinks the real keyspace. Discarding the ragged tail of the byte range costs nothing here.
 */
function randomIndex(bound: number): number {
  const limit = Math.floor(256 / bound) * bound;
  const byte = new Uint8Array(1);

  for (;;) {
    window.crypto.getRandomValues(byte);
    if (byte[0] < limit) return byte[0] % bound;
  }
}

/** Generate a password, guaranteeing at least one character from each enabled class. */
export function generatePassword(options: GeneratorOptions): string {
  const pools = [LOWER];
  if (options.upper) pools.push(UPPER);
  if (options.digits) pools.push(DIGITS);
  if (options.symbols) pools.push(SYMBOLS);

  const alphabet = pools.join("");
  const length = Math.max(options.length, pools.length);

  // One from each pool first, so a generated password always satisfies "must contain a digit"
  // style rules, then fill the rest from the whole alphabet.
  const chars = pools.map((pool) => pool[randomIndex(pool.length)]);
  while (chars.length < length) {
    chars.push(alphabet[randomIndex(alphabet.length)]);
  }

  // Fisher-Yates, so the guaranteed characters are not stuck at the front.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/** Rough bits of entropy, from the character classes actually present. */
export function entropyBits(password: string): number {
  if (!password) return 0;

  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;

  return Math.round(password.length * Math.log2(pool || 1));
}

export type PasswordVerdict = "weak" | "fair" | "strong";

/**
 * Entropy alone overrates patterns a human chose, so obvious ones are demoted. This is a nudge
 * in the audit, not a gate: nothing here blocks saving a password the user insists on.
 */
export function ratePassword(password: string): { bits: number; verdict: PasswordVerdict } {
  const bits = entropyBits(password);

  const predictable =
    password.length < 10 ||
    /^[a-z]+$/i.test(password) ||
    /^\d+$/.test(password) ||
    /(.)\1{2,}/.test(password) ||
    /(1234|abcd|qwer|password|admin|letmein)/i.test(password);

  if (predictable || bits < 50) return { bits, verdict: "weak" };
  if (bits < 75) return { bits, verdict: "fair" };
  return { bits, verdict: "strong" };
}
