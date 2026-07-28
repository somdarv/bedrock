/**
 * Round-trips the vault's own crypto: envelope (create/unlock/rewrap/entry), the encrypted
 * backup file, and the password generator. A silent failure in any of these loses data or
 * quietly weakens it, so all three are exercised end to end against the real source.
 *
 * Modules are compiled with the project's own TypeScript, then loaded as data: URLs with their
 * relative imports rewritten, so what runs here is exactly what ships.
 */
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

globalThis.window = { crypto: webcrypto };
globalThis.btoa = (s) => Buffer.from(s, "binary").toString("base64");
globalThis.atob = (s) => Buffer.from(s, "base64").toString("binary");
globalThis.document = { createElement: () => ({ click() {} }) };
globalThis.Blob = class {};
globalThis.URL.createObjectURL = () => "blob:stub";
globalThis.URL.revokeObjectURL = () => {};

const ROOT = path.join(REPO, "src", "lib", "vault");
const compiled = new Map();

/** Compile a vault module and inline its local imports, so the graph loads without a bundler. */
function moduleUrl(name) {
  if (compiled.has(name)) return compiled.get(name);

  const source = readFileSync(path.join(ROOT, `${name}.ts`), "utf8");
  let js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  // Point "./crypto" style imports at the compiled data: URL for that module.
  js = js.replace(/from "\.\/(\w[\w-]*)"/g, (_, dep) => `from "${moduleUrl(dep)}"`);

  const url = `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`;
  compiled.set(name, url);
  return url;
}

const cryptoMod = await import(moduleUrl("crypto"));
const exportMod = await import(moduleUrl("export"));
const generatorMod = await import(moduleUrl("generator"));
const auditMod = await import(moduleUrl("audit"));

let failures = 0;
const check = (ok, label) => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};

/* ------------------------------------------------------------------ envelope */

const PASS1 = "correct horse battery staple";
const PASS2 = "a completely different four words";

const { input, dataKey } = await cryptoMod.createVaultKey(PASS1);
check(input.iterations === 600000, "createVaultKey uses 600k iterations");
check(input.kdf === "pbkdf2-sha256", "createVaultKey records the KDF");

const secret = {
  label: "Namecheap",
  url: "https://ap.www.namecheap.com",
  username: "me@example.com",
  password: "s3cr3t-p@ssw0rd-x9",
  totpSecret: "JBSWY3DPEHPK3PXP",
  backupCodes: ["a1b2-c3d4", "e5f6-g7h8"],
  usedBackupCodes: ["a1b2-c3d4"],
  notes: "line one\nline two, with a comma and an accent: café",
  category: "hosting",
  lastChangedAt: "2026-07-28",
};

const blob = await cryptoMod.encryptSecret(dataKey, secret);
const back = await cryptoMod.decryptSecret(dataKey, blob.ciphertext, blob.iv);
check(JSON.stringify(back) === JSON.stringify(secret), "entry encrypt/decrypt round-trips");

const record = { ...input, createdAt: "", updatedAt: "" };
const unlocked = await cryptoMod.unlockVault(PASS1, record);
const viaUnlock = await cryptoMod.decryptSecret(unlocked, blob.ciphertext, blob.iv);
check(viaUnlock.password === secret.password, "unlockVault recovers the data key");

let wrongRejected = false;
try {
  await cryptoMod.unlockVault("wrong passphrase entirely", record);
} catch (e) {
  wrongRejected = e.name === "VaultUnlockError";
}
check(wrongRejected, "wrong passphrase throws VaultUnlockError");

// Rewrap, then confirm existing entries still open and the old passphrase stops working.
const rewrapped = await cryptoMod.rewrapVaultKey(unlocked, PASS2);
const rewrappedRecord = { ...rewrapped, createdAt: "", updatedAt: "" };
const afterChange = await cryptoMod.unlockVault(PASS2, rewrappedRecord);
const stillReadable = await cryptoMod.decryptSecret(afterChange, blob.ciphertext, blob.iv);
check(stillReadable.password === secret.password, "rewrap keeps existing entries readable");
check(rewrapped.salt !== input.salt, "rewrap uses a fresh salt");

let oldPassRejected = false;
try {
  await cryptoMod.unlockVault(PASS1, rewrappedRecord);
} catch {
  oldPassRejected = true;
}
check(oldPassRejected, "old passphrase stops working after a change");

const a = await cryptoMod.encryptSecret(dataKey, secret);
const b = await cryptoMod.encryptSecret(dataKey, secret);
check(a.iv !== b.iv && a.ciphertext !== b.ciphertext, "each write uses a fresh IV");

// A key from a different vault must not open this entry.
const other = await cryptoMod.createVaultKey("some other vault passphrase");
let crossKeyFails = false;
try {
  await cryptoMod.decryptSecret(other.dataKey, blob.ciphertext, blob.iv);
} catch {
  crossKeyFails = true;
}
check(crossKeyFails, "another vault's key cannot open this entry");

/* -------------------------------------------------------------------- backup */

const FILE_PASS = "backup passphrase for the file";
const file = await exportMod.buildExport([secret, { ...secret, label: "Hostinger" }], FILE_PASS);
check(file.format === "bedrock-vault-export" && file.count === 2, "export file has its header");
check(!JSON.stringify(file).includes(secret.password), "export file leaks no plaintext");
check(!JSON.stringify(file).includes("Namecheap"), "export file leaks no labels");

const restored = await exportMod.readExport(JSON.stringify(file), FILE_PASS);
check(restored.length === 2 && restored[0].password === secret.password, "backup round-trips");
check(
  JSON.stringify(restored[0].backupCodes) === JSON.stringify(secret.backupCodes) &&
    restored[0].totpSecret === secret.totpSecret,
  "backup preserves 2FA seed and codes",
);
check(restored[0].notes === secret.notes, "backup preserves non-ASCII notes");

for (const [raw, label] of [
  [JSON.stringify(file), "wrong backup passphrase is refused"],
  ['{"format":"something-else"}', "a foreign file is refused"],
  ["not json at all", "a non-JSON file is refused"],
]) {
  let rejected = false;
  try {
    await exportMod.readExport(raw, label.startsWith("wrong") ? "nope" : FILE_PASS);
  } catch (e) {
    rejected = e.name === "VaultImportError";
  }
  check(rejected, label);
}

/* ----------------------------------------------------------------- generator */

const generated = new Set();
for (let i = 0; i < 200; i += 1) {
  generated.add(generatorMod.generatePassword(generatorMod.DEFAULT_GENERATOR));
}
check(generated.size === 200, "200 generated passwords are all distinct");

const sample = [...generated][0];
check(sample.length === 20, "generated password honours the requested length");
check(
  /[a-z]/.test(sample) && /[A-Z]/.test(sample) && /\d/.test(sample) && /[^A-Za-z0-9]/.test(sample),
  "generated password includes every enabled class",
);
check(generatorMod.ratePassword(sample).verdict === "strong", "generated password rates as strong");
check(generatorMod.ratePassword("password123").verdict === "weak", "obvious password rates weak");

const lettersOnly = generatorMod.generatePassword({
  length: 16,
  upper: false,
  digits: false,
  symbols: false,
});
check(/^[a-z]{16}$/.test(lettersOnly), "disabling every class leaves lowercase only");

/* --------------------------------------------------------------------- audit */

const item = (over) => ({
  id: Math.random().toString(36).slice(2),
  createdAt: "",
  updatedAt: "",
  ...secret,
  usedBackupCodes: [],
  ...over,
});

const health = auditMod.auditVault([
  item({ label: "A", password: "shared-Pass-99!x", lastChangedAt: "2026-07-01" }),
  item({ label: "B", password: "shared-Pass-99!x", lastChangedAt: "2026-07-01" }),
  item({
    label: "C",
    password: generatorMod.generatePassword(generatorMod.DEFAULT_GENERATOR),
    lastChangedAt: "2020-01-01",
  }),
  item({ label: "D", password: "abc", lastChangedAt: "2026-07-01" }),
  item({
    label: "E",
    password: generatorMod.generatePassword(generatorMod.DEFAULT_GENERATOR),
    lastChangedAt: "2026-07-01",
    backupCodes: ["x", "y"],
    usedBackupCodes: ["x", "y"],
  }),
]);

check(health.counts.reused === 2, "audit flags both sides of a reused password");
check(health.counts.stale === 1, "audit flags the stale entry");
check(health.counts.weak === 1, "audit flags the weak entry");
check(health.counts["codes-low"] === 1, "audit flags exhausted backup codes");
// The other four hold an untouched 2-code set: scarcity alone must not raise a warning.
check(
  !health.issues.some((i) => i.kind === "codes-low" && i.item.label !== "E"),
  "audit does not flag untouched backup code sets",
);

const partly = auditMod.auditVault([
  item({ label: "F", backupCodes: ["1", "2", "3", "4"], usedBackupCodes: ["1", "2"] }),
  item({ label: "G", backupCodes: ["1", "2", "3", "4"], usedBackupCodes: ["1", "2", "3"] }),
  item({ label: "H", backupCodes: ["1", "2", "3", "4", "5"], usedBackupCodes: ["1"] }),
]);
// F has 2 left and G has 1: both are close enough to lockout to warn. H has 4 left, so it is not.
check(partly.counts["codes-low"] === 2, "audit flags the depleted sets and not the healthy one");
check(
  !partly.issues.some((i) => i.kind === "codes-low" && i.item.label === "H"),
  "audit leaves a set with plenty remaining alone",
);

console.log(failures === 0 ? "\nAll vault checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
