import "server-only";
import * as zlib from "node:zlib";

/**
 * A streaming ZIP writer, built for handing a client a folder of finished work.
 *
 * - **Stored, not deflated.** Deliverables are JPEGs, PDFs, MP4s and archives: already
 *   compressed. Deflating them again costs CPU for a percent or two, and storing lets the
 *   archive's exact length be known before the first byte, so the browser shows a real
 *   progress bar and time remaining.
 * - **Streamed.** Each file is pulled from storage and passed straight through. Memory holds
 *   one chunk, never one file, so a 6 GB folder costs the server what a 6 KB one does.
 * - **ZIP64 where needed.** A single file is at most 2 GB, but a folder of them can pass 4 GB,
 *   and past that the 32-bit offsets overflow. Only the fields that overflow switch to ZIP64,
 *   so ordinary archives stay readable by the oldest unzip tools.
 *
 * Each entry uses a data descriptor (the CRC is only known once the bytes have gone past),
 * and the UTF-8 flag, so a name like "Brochure ₵ prices.pdf" survives on Windows and macOS.
 */

export interface ZipEntrySource {
  /** Path inside the archive, forward slashes. */
  path: string;
  /** Expected bytes. Null when unknown, which drops the Content-Length for the whole archive. */
  size: number | null;
  modifiedAt?: string | null;
  open(): Promise<ReadableStream<Uint8Array>>;
}

const MAX32 = 0xffffffff;
const MAX16 = 0xffff;
const LOCAL_HEADER = 30;
const DESCRIPTOR = 16;
const CENTRAL_HEADER = 46;
const ZIP64_OFFSET_EXTRA = 12; // header id + length + one 8-byte offset
const ZIP64_END = 56;
const ZIP64_LOCATOR = 20;
const END = 22;

const encoder = new TextEncoder();

/** Exact archive size when every entry's size is known, otherwise null. */
export function zipLength(entries: ZipEntrySource[]): number | null {
  let offset = 0;
  let central = 0;
  for (const e of entries) {
    if (e.size === null) return null;
    const name = encoder.encode(e.path).length;
    const needs64 = offset >= MAX32;
    central += CENTRAL_HEADER + name + (needs64 ? ZIP64_OFFSET_EXTRA : 0);
    offset += LOCAL_HEADER + name + e.size + DESCRIPTOR;
  }
  const zip64 = offset >= MAX32 || central >= MAX32 || entries.length >= MAX16;
  return offset + central + (zip64 ? ZIP64_END + ZIP64_LOCATOR : 0) + END;
}

type Written = { name: Uint8Array; crc: number; size: number; offset: number; time: number; date: number };

export function zipStream(entries: ZipEntrySource[]): ReadableStream<Uint8Array> {
  const written: Written[] = [];
  let offset = 0;
  let index = 0;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let current: { entry: ZipEntrySource; meta: Written; crc: number; size: number } | null = null;
  let finished = false;

  return new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        if (finished) return;

        // Between files: open the next one, or write the directory and stop.
        if (!current) {
          if (index >= entries.length) {
            controller.enqueue(centralDirectory(written, offset));
            controller.close();
            finished = true;
            return;
          }

          const entry = entries[index++];
          const name = encoder.encode(entry.path);
          const { time, date } = dosDateTime(entry.modifiedAt);
          const meta: Written = { name, crc: 0, size: 0, offset, time, date };
          reader = (await entry.open()).getReader();
          current = { entry, meta, crc: 0, size: 0 };

          const header = localHeader(name, time, date);
          offset += header.length;
          controller.enqueue(header);
          return;
        }

        const { done, value } = await reader!.read();
        if (!done) {
          if (value.length > 0) {
            current.crc = crc32(value, current.crc);
            current.size += value.length;
            offset += value.length;
            controller.enqueue(value);
          }
          return;
        }

        // A file that came back a different length from the one on record would make the
        // announced Content-Length a lie and leave the client with a corrupt archive. Fail loudly
        // instead: the browser marks the download failed and it can simply be tried again.
        if (current.entry.size !== null && current.entry.size !== current.size) {
          throw new Error(
            `${current.entry.path} is ${current.size} bytes, but ${current.entry.size} were expected.`,
          );
        }
        if (current.size >= MAX32) {
          throw new Error(`${current.entry.path} is too large for this archive.`);
        }

        current.meta.crc = current.crc;
        current.meta.size = current.size;
        written.push(current.meta);
        const descriptor = dataDescriptor(current.crc, current.size);
        offset += descriptor.length;
        controller.enqueue(descriptor);
        current = null;
        reader = null;
      },
      async cancel(reason) {
        finished = true;
        await reader?.cancel(reason).catch(() => undefined);
      },
    },
    // Pull one chunk at a time: the client's download speed sets the pace, not storage's.
    { highWaterMark: 0 },
  );
}

/* ------------------------------------------------------------------ records */

// General purpose flags: bit 3 (sizes in the data descriptor) + bit 11 (UTF-8 names).
const FLAGS = 0x0808;

function localHeader(name: Uint8Array, time: number, date: number) {
  const b = new DataView(new ArrayBuffer(LOCAL_HEADER));
  b.setUint32(0, 0x04034b50, true);
  b.setUint16(4, 20, true); // version needed: 2.0
  b.setUint16(6, FLAGS, true);
  b.setUint16(8, 0, true); // method: stored
  b.setUint16(10, time, true);
  b.setUint16(12, date, true);
  // CRC and both sizes are zero here and follow in the data descriptor.
  b.setUint16(26, name.length, true);
  b.setUint16(28, 0, true);
  return concat(new Uint8Array(b.buffer), name);
}

function dataDescriptor(crc: number, size: number) {
  const b = new DataView(new ArrayBuffer(DESCRIPTOR));
  b.setUint32(0, 0x08074b50, true);
  b.setUint32(4, crc, true);
  b.setUint32(8, size, true);
  b.setUint32(12, size, true);
  return new Uint8Array(b.buffer);
}

function centralDirectory(entries: Written[], start: number) {
  const parts: Uint8Array[] = [];
  let length = 0;

  for (const e of entries) {
    const needs64 = e.offset >= MAX32;
    const extraLength = needs64 ? ZIP64_OFFSET_EXTRA : 0;
    const b = new DataView(new ArrayBuffer(CENTRAL_HEADER + extraLength));
    b.setUint32(0, 0x02014b50, true);
    b.setUint16(4, needs64 ? 45 : 20, true); // version made by (MS-DOS host)
    b.setUint16(6, needs64 ? 45 : 20, true); // version needed
    b.setUint16(8, FLAGS, true);
    b.setUint16(10, 0, true);
    b.setUint16(12, e.time, true);
    b.setUint16(14, e.date, true);
    b.setUint32(16, e.crc, true);
    b.setUint32(20, e.size, true);
    b.setUint32(24, e.size, true);
    b.setUint16(28, e.name.length, true);
    b.setUint16(30, extraLength, true);
    b.setUint32(42, needs64 ? MAX32 : e.offset, true);
    // The extra field goes after the name, so write the fixed part, then name, then extra.
    const fixed = new Uint8Array(b.buffer, 0, CENTRAL_HEADER);
    parts.push(fixed.slice(), e.name);
    if (needs64) {
      const x = new DataView(new ArrayBuffer(ZIP64_OFFSET_EXTRA));
      x.setUint16(0, 0x0001, true);
      x.setUint16(2, 8, true);
      x.setBigUint64(4, BigInt(e.offset), true);
      parts.push(new Uint8Array(x.buffer));
    }
    length += CENTRAL_HEADER + e.name.length + extraLength;
  }

  const zip64 = start >= MAX32 || length >= MAX32 || entries.length >= MAX16;

  if (zip64) {
    const end64 = new DataView(new ArrayBuffer(ZIP64_END));
    end64.setUint32(0, 0x06064b50, true);
    end64.setBigUint64(4, BigInt(ZIP64_END - 12), true);
    end64.setUint16(12, 45, true);
    end64.setUint16(14, 45, true);
    end64.setBigUint64(24, BigInt(entries.length), true);
    end64.setBigUint64(32, BigInt(entries.length), true);
    end64.setBigUint64(40, BigInt(length), true);
    end64.setBigUint64(48, BigInt(start), true);
    parts.push(new Uint8Array(end64.buffer));

    const locator = new DataView(new ArrayBuffer(ZIP64_LOCATOR));
    locator.setUint32(0, 0x07064b50, true);
    locator.setBigUint64(8, BigInt(start + length), true);
    locator.setUint32(16, 1, true);
    parts.push(new Uint8Array(locator.buffer));
  }

  const end = new DataView(new ArrayBuffer(END));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Math.min(entries.length, MAX16), true);
  end.setUint16(10, Math.min(entries.length, MAX16), true);
  end.setUint32(12, zip64 ? MAX32 : length, true);
  end.setUint32(16, zip64 ? MAX32 : start, true);
  parts.push(new Uint8Array(end.buffer));

  return concat(...parts);
}

/* ------------------------------------------------------------------ helpers */

function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** MS-DOS date and time, local to Accra, which is what the unzip tool will show. */
function dosDateTime(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1980 ? new Date() : d;
  // Ghana is UTC+0 all year, so UTC fields are the local ones.
  return {
    time: (safe.getUTCHours() << 11) | (safe.getUTCMinutes() << 5) | Math.floor(safe.getUTCSeconds() / 2),
    date: ((safe.getUTCFullYear() - 1980) << 9) | ((safe.getUTCMonth() + 1) << 5) | safe.getUTCDate(),
  };
}

const nativeCrc = (zlib as unknown as { crc32?: (data: Uint8Array, value?: number) => number }).crc32;

let table: Uint32Array | null = null;

/** Running CRC-32. Node 20.15+ has it natively; the table version is the fallback. */
export function crc32(data: Uint8Array, value = 0): number {
  if (nativeCrc) return nativeCrc(data, value);
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = (value ^ MAX32) >>> 0;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ MAX32) >>> 0;
}
