"use client";

import * as React from "react";
import type { UploadPlan, WorkPackage } from "@/lib/api/types";

/**
 * The upload queue behind the file browser.
 *
 * A file is opened with the API, which says how to send it. On R2 it goes in 10 MB parts,
 * four at a time, each retried on its own, so a dropped connection costs one part rather than
 * the whole file. Parts go straight to storage when the bucket allows it (a CORS rule) and
 * through the hub otherwise; the first refused direct send switches the rest of the session to
 * the relay, so a missing rule slows uploads down instead of breaking them.
 *
 * Two files upload at once. Progress is reported at most every 150 ms.
 */

export type UploadStatus = "queued" | "uploading" | "finishing" | "done" | "failed" | "cancelled";

export interface UploadItem {
  key: string;
  name: string;
  size: number;
  /** Where it is going, in words: "Final", or the project name for the root. */
  destination: string;
  status: UploadStatus;
  loaded: number;
  error?: string;
}

export interface UploadRequest {
  file: File;
  folderId: string | null;
  destination: string;
}

const FILE_CONCURRENCY = 2;
const PART_CONCURRENCY = 4;
const PART_ATTEMPTS = 4;
/** Signed part URLs last an hour; ask again well before that. */
const URL_FRESH_MS = 40 * 60 * 1000;
const RELAY_KEY = "bedrock:upload-relay";
const DROPPED = "The connection dropped before the file finished. Try again.";

class Cancelled extends Error {
  constructor() {
    super("Cancelled");
  }
}

interface Job {
  item: UploadItem;
  file: File;
  folderId: string | null;
  controller: AbortController;
  uploadId?: string;
}

export function useUploads(packageId: string, onPackage: (pkg: WorkPackage) => void) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const jobs = React.useRef(new Map<string, Job>());
  const queue = React.useRef<string[]>([]);
  const running = React.useRef(0);
  const flushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPackageRef = React.useRef(onPackage);
  onPackageRef.current = onPackage;

  const flush = React.useCallback((now = false) => {
    const publish = () => {
      flushTimer.current = null;
      setItems([...jobs.current.values()].map((j) => ({ ...j.item })));
    };
    if (now) {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      publish();
    } else if (!flushTimer.current) {
      flushTimer.current = setTimeout(publish, 150);
    }
  }, []);

  const pump = React.useCallback(() => {
    while (running.current < FILE_CONCURRENCY && queue.current.length > 0) {
      const key = queue.current.shift()!;
      const job = jobs.current.get(key);
      if (!job || job.item.status !== "queued") continue;
      running.current++;
      job.item.status = "uploading";
      flush(true);
      send(packageId, job, flush)
        .then((pkg) => {
          job.item.status = "done";
          job.item.loaded = job.item.size;
          if (pkg) onPackageRef.current(pkg);
        })
        .catch((e) => {
          if (e instanceof Cancelled || job.controller.signal.aborted) {
            job.item.status = "cancelled";
          } else {
            job.item.status = "failed";
            job.item.error = e instanceof Error ? e.message : "Upload failed.";
          }
          // Throw away whatever parts storage already holds.
          if (job.uploadId) {
            void fetch(`/api/admin/packages/${packageId}/uploads/${job.uploadId}`, {
              method: "DELETE",
            }).catch(() => undefined);
            job.uploadId = undefined;
          }
        })
        .finally(() => {
          running.current--;
          flush(true);
          pump();
        });
    }
  }, [packageId, flush]);

  const add = React.useCallback(
    (requests: UploadRequest[]) => {
      for (const r of requests) {
        const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        jobs.current.set(key, {
          file: r.file,
          folderId: r.folderId,
          controller: new AbortController(),
          item: {
            key,
            name: r.file.name,
            size: r.file.size,
            destination: r.destination,
            status: "queued",
            loaded: 0,
          },
        });
        queue.current.push(key);
      }
      flush(true);
      pump();
    },
    [flush, pump],
  );

  const cancel = React.useCallback(
    (key: string) => {
      const job = jobs.current.get(key);
      if (!job) return;
      if (job.item.status === "queued") job.item.status = "cancelled";
      job.controller.abort();
      flush(true);
    },
    [flush],
  );

  const retry = React.useCallback(
    (key: string) => {
      const job = jobs.current.get(key);
      if (!job || (job.item.status !== "failed" && job.item.status !== "cancelled")) return;
      job.controller = new AbortController();
      job.item = { ...job.item, status: "queued", loaded: 0, error: undefined };
      queue.current.push(key);
      flush(true);
      pump();
    },
    [flush, pump],
  );

  const clear = React.useCallback(() => {
    for (const [key, job] of jobs.current) {
      if (["done", "failed", "cancelled"].includes(job.item.status)) jobs.current.delete(key);
    }
    flush(true);
  }, [flush]);

  const cancelAll = React.useCallback(() => {
    for (const key of jobs.current.keys()) cancel(key);
  }, [cancel]);

  const active = items.some((i) => ["queued", "uploading", "finishing"].includes(i.status));

  // Closing the tab mid-upload loses the file. Ask first.
  React.useEffect(() => {
    if (!active) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);

  return { items, active, add, cancel, retry, clear, cancelAll };
}

/* ---------------------------------------------------------------- transport */

async function send(
  packageId: string,
  job: Job,
  report: () => void,
): Promise<WorkPackage | null> {
  const { file, controller } = job;
  const plan = await json<UploadPlan>(`/api/admin/packages/${packageId}/uploads`, {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
      mime: file.type || null,
      folderId: job.folderId,
    }),
    signal: controller.signal,
  });

  if (plan.strategy === "done") return plan.package;

  if (plan.strategy === "form") {
    const form = new FormData();
    form.append("file", file);
    if (job.folderId) form.append("folderId", job.folderId);
    const res = await xhr("POST", `/api/admin/packages/${packageId}/uploads/form`, form, {
      signal: controller.signal,
      onProgress: (loaded) => {
        // The request carries the form's own boundaries too; never report more than the file.
        job.item.loaded = Math.min(loaded, job.item.size);
        report();
      },
    });
    if (res.status === 0) throw new Error(DROPPED);
    if (res.status < 200 || res.status >= 300) throw new Error(messageFrom(res.text, "Upload failed."));
    job.item.status = "finishing";
    return JSON.parse(res.text) as WorkPackage;
  }

  job.uploadId = plan.id;
  const base = `/api/admin/packages/${packageId}/uploads/${plan.id}`;
  let direct = plan.direct && !relayForced();
  const urls = new Map<number, { url: string; at: number }>();
  const loaded = new Map<number, number>();
  const etags: { partNumber: number; etag: string }[] = [];

  const urlFor = async (n: number) => {
    const cached = urls.get(n);
    if (cached && Date.now() - cached.at < URL_FRESH_MS) return cached.url;
    // Sign this part and the next ones in one call.
    const batch = Array.from({ length: Math.min(100, plan.partCount - n + 1) }, (_, i) => n + i);
    const signed = await json<{ urls: Record<string, string> }>(`${base}/parts`, {
      method: "POST",
      body: JSON.stringify({ parts: batch }),
      signal: controller.signal,
    });
    const at = Date.now();
    for (const [k, url] of Object.entries(signed.urls)) urls.set(Number(k), { url, at });
    return urls.get(n)!.url;
  };

  const progress = () => {
    job.item.loaded = [...loaded.values()].reduce((a, b) => a + b, 0);
    report();
  };

  const sendPart = async (n: number) => {
    const start = (n - 1) * plan.partSize;
    const blob = file.slice(start, Math.min(start + plan.partSize, file.size));

    for (let attempt = 1; ; attempt++) {
      if (controller.signal.aborted) throw new Cancelled();
      const onProgress = (bytes: number) => {
        loaded.set(n, bytes);
        progress();
      };
      try {
        if (direct) {
          const res = await xhr("PUT", await urlFor(n), blob, { signal: controller.signal, onProgress });
          const etag = res.etag;
          // Status 0, or a success whose ETag the browser may not read, is the bucket's CORS
          // rule missing. Switch to the relay for this file and the rest of the session.
          if (res.status === 0 || (res.status < 300 && !etag)) {
            forceRelay();
            direct = false;
            attempt--;
            continue;
          }
          if (res.status >= 300) throw new Error(`Storage refused part ${n} (${res.status}).`);
          etags.push({ partNumber: n, etag: etag! });
        } else {
          const res = await xhr("PUT", `${base}/parts/${n}`, blob, { signal: controller.signal, onProgress });
          if (res.status === 0) throw new Error(DROPPED);
          if (res.status < 200 || res.status >= 300) {
            throw new Error(messageFrom(res.text, `Part ${n} did not go through.`));
          }
          etags.push({ partNumber: n, etag: (JSON.parse(res.text) as { etag: string }).etag });
        }
        loaded.set(n, blob.size);
        progress();
        return;
      } catch (e) {
        if (e instanceof Cancelled || controller.signal.aborted) throw new Cancelled();
        loaded.set(n, 0);
        progress();
        if (attempt >= PART_ATTEMPTS) throw e;
        await sleep(800 * attempt * attempt, controller.signal);
      }
    }
  };

  // A small pool: each worker takes the next part until none are left.
  let next = 1;
  const worker = async () => {
    while (next <= plan.partCount) {
      const n = next++;
      await sendPart(n);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(PART_CONCURRENCY, plan.partCount) }, () => worker()),
  );

  job.item.status = "finishing";
  report();
  const pkg = await json<WorkPackage>(`${base}/complete`, {
    method: "POST",
    body: JSON.stringify({ parts: etags }),
    signal: controller.signal,
  });
  job.uploadId = undefined;
  return pkg;
}

async function json<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    if (init.signal?.aborted) throw new Cancelled();
    throw e instanceof Error ? new Error(DROPPED) : e;
  }
  const text = await res.text();
  if (!res.ok) throw new Error(messageFrom(text, "The server refused the upload."));
  return JSON.parse(text) as T;
}

function messageFrom(text: string, fallback: string) {
  try {
    const body = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
    const first = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    return first || body.message || fallback;
  } catch {
    return fallback;
  }
}

function xhr(
  method: string,
  url: string,
  body: Blob | FormData,
  opts: { signal: AbortSignal; onProgress?: (loaded: number) => void },
): Promise<{ status: number; text: string; etag: string | null }> {
  return new Promise((resolve, reject) => {
    if (opts.signal.aborted) return reject(new Cancelled());
    const req = new XMLHttpRequest();
    req.open(method, url);
    req.upload.onprogress = (e) => opts.onProgress?.(e.loaded);
    req.onload = () =>
      resolve({ status: req.status, text: req.responseText, etag: req.getResponseHeader("ETag") });
    // A network error and a CORS refusal look the same from here: status 0.
    req.onerror = () => resolve({ status: 0, text: "", etag: null });
    req.onabort = () => reject(new Cancelled());
    opts.signal.addEventListener("abort", () => req.abort(), { once: true });
    req.send(body);
  });
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new Cancelled());
      },
      { once: true },
    );
  });
}

function relayForced() {
  try {
    return sessionStorage.getItem(RELAY_KEY) === "1";
  } catch {
    return false;
  }
}

function forceRelay() {
  try {
    sessionStorage.setItem(RELAY_KEY, "1");
  } catch {
    // Private mode: the switch simply lasts for this file.
  }
}
