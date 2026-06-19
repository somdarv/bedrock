# ADR 0003 — Deliverables: images + PDF + video

**Status:** Accepted · **Date:** 2026-06-19

## Decision

v1 supports three deliverable types — **images, PDF, and video** — each watermarked and
downscaled into a preview, with the clean original locked until the download gate opens. The
media engine lives in the Laravel repo.

## Why

- Covers the real range of freelance deliverables rather than images alone.
- Each type maps to a proven tool: **Intervention Image** (images), **Imagick/Ghostscript** (PDF),
  **FFmpeg** (video).

## Consequences

- The VPS must have FFmpeg, Imagick, and Ghostscript installed.
- Media jobs run on a dedicated `media` queue; **video gets its own Horizon worker** — it is the
  heaviest CPU cost in the system, so concurrency is capped.
- Unlike image previews, **video previews are not "tiny"** and are served from R2/CDN, not inlined.
- Originals are served only via signed, time-limited R2 URLs after `Balance == 0` — see
  [ARCHITECTURE §6](../ARCHITECTURE.md).
