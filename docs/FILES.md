# Files — the client work repository

> How a work package's files are stored, shown, uploaded and handed over. Built 2026-09-17.
> Frontend: `src/components/files/`, `src/lib/files/`. API: `Admin\PackageFileController`,
> `App\Services\Files\`.

Every package has a repository that behaves like a shared drive: folders inside folders, files
filed into them, renames, moves, bulk delete, and downloads a folder at a time. The operator sees
all of it; the client sees the same tree with previews, and can download whatever the money rule
has unlocked.

## 1. Where it appears

| Screen | What it is |
|---|---|
| `/admin/files` | Every client as a folder, newest work first, and a search across every file in every project. |
| `/admin/files/{client}` | That client's projects, each a folder. |
| `/admin/packages/{id}/files` | One project's repository, full width. `?folder=` opens a folder. |
| `/admin/packages/{id}` | The same browser, embedded under the project's money and scope. |
| `/p/{slug}` | The client's view: browse, preview, download what is unlocked. |

One component serves all of them: `FileBrowser` with `mode="admin"` or `mode="client"`.

## 2. The model

```
deliverable_folders   id, work_package_id, parent_id (self, cascade), name, timestamps
deliverables          + folder_id (null = project root), size, mime, upload_id
```

- A null `parent_id` or `folder_id` is the project root.
- `processing_status = 'uploading'` means the browser is still sending parts. Those rows are left
  out of `WorkPackage::toApi()`, so nothing shows a half-arrived file.
- The folder tree is small, so it travels whole with the package and is walked in memory
  (`App\Services\Files\FileTree`, and `src/lib/files/tree.ts` on the frontend).
- Deleting a folder deletes everything under it, **and the stored objects** (`purgeStorage()`).
  Before this existed, a removed file stayed in the bucket for good.

## 3. Uploads

A file can be 2 GB (`MEDIA_MAX_UPLOAD_MB`, default 2048), which no single request can carry:
nginx stops at 210 MB and PHP would hold the whole file before moving it again. So the browser
asks how to send it and then sends it in parts.

```
POST   /api/admin/packages/{id}/uploads                        → the plan
POST   /api/admin/packages/{id}/uploads/{file}/parts           → presigned PUT URLs (≤100)
PUT    /api/admin/packages/{id}/uploads/{file}/parts/{n}       → (hub) relay one part
POST   /api/admin/packages/{id}/uploads/{file}/complete        → join the parts
DELETE /api/admin/packages/{id}/uploads/{file}                 → cancel, throw the parts away
POST   /api/admin/packages/{id}/uploads/form                   → one-request upload (local disk)
```

The plan is one of:

- **`multipart`** — object storage. 10 MB parts (R2 requires every part but the last to be the
  same size), four in flight, each retried on its own, so a dropped connection costs one part.
- **`form`** — the disk cannot take parts (the local disk in dev, and the mock backend). One
  request, PHP's own limits apply.
- **`done`** — an empty file. Nothing to send.

`src/lib/files/use-uploads.ts` is the browser side: the queue, two files at once, progress, cancel,
retry, and the tray. `PUT` requests go through `XMLHttpRequest` because `fetch` cannot report
upload progress.

### Direct to R2, or relayed through the hub

By default each part goes **browser → hub → R2**. That needs no setup and works today, but the
bytes cross the server. **Browser → R2** is faster and costs us no bandwidth, and needs a CORS
rule on the bucket, which our R2 API token cannot set (it is object-scoped; `GetBucketCors`
returns AccessDenied). Add it once in the Cloudflare dashboard, under R2 → `bedrock-deliverables`
→ Settings → CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://hub.saharabasetech.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

`ExposeHeaders: ETag` is the part that matters: without it the browser cannot read the part's
ETag and the upload cannot be completed. Then set `DELIVERABLES_DIRECT_UPLOAD=true` in the API
`.env` and `php artisan config:clear`. If a direct part is ever refused, the browser switches
that session to the relay by itself, so a wrong rule slows uploads down instead of breaking them.

### Abandoned uploads

A closed tab leaves parts in R2, which storage bills for. `files:prune-uploads` aborts anything
unfinished after a day and is scheduled at 03:00. (R2 also drops incomplete multipart uploads
after seven days by default.)

## 4. Downloads

- **One file** — a signed R2 URL, 30 minutes, with the right filename and type in the
  `Content-Disposition` (including `filename*=UTF-8''…`, so "Brochure ₵ prices.pdf" survives).
  The bytes go from R2 to the browser; nothing passes through the hub.
- **A folder, a selection, or everything** — a ZIP streamed by the hub
  (`src/lib/files/zip.ts`). The API answers with a manifest (paths, sizes, signed URLs); the hub
  pulls each file and writes it into the archive as it goes. Memory holds one chunk, not one file.
  Entries are **stored, not deflated** (deliverables are already compressed), which means the
  exact archive length is known up front: the browser shows a real progress bar and time
  remaining. ZIP64 kicks in past 4 GB. Verified against Python's `zipfile` and Windows Explorer,
  including a 4.5 GB archive.
- The gate is unchanged, and it lives in the API: the client manifest lists only unlocked,
  non-archived files, and refuses with 403 when everything is locked.

Admin downloads post a hidden form to the ZIP route so the browser's own download manager takes
over; a client uses a plain link.

## 5. Storage housekeeping

| Command | What it does |
|---|---|
| `php artisan files:backfill-sizes` | Records size and type for files uploaded before those columns existed (a HEAD per file, no download). Run once after deploying. |
| `php artisan files:prune-uploads` | Clears unfinished uploads (scheduled daily). |
| `php artisan media:regenerate` | Rebuilds previews. |

"Free up storage" on a project still deletes the originals and keeps the previews, for work that
is delivered and paid for.

## 6. Previews

Images, PDFs and videos get a generated preview; everything else shows its extension as a tile
(`FileGlyph`), which costs no request at all. `hasPreview` on the API tells the browser which is
which, so it never fetches a placeholder image.

A 2 GB video is never read into memory: `MediaPipeline` streams a PDF or video to a temporary
file, and reads a video straight from a signed URL when FFmpeg is available, so it only pulls the
first seconds. Images above 60 MB keep their icon, because GD would need the whole bitmap.

## 7. Gotchas

- **Chrome sticks a `position: sticky` element to the scroll container's content edge**, and the
  admin shell's `<main>` has padding, which left a strip where content slid under the toolbar.
  The shell now sets `--drive-sticky-top` to minus its own padding; the portal leaves it at 0.
- **An invisible tick box still takes taps.** The boxes are `pointer-events-none` until shown,
  and Tailwind's `hover:` only exists on devices that hover, so a phone is safe.
- **Android turns a long press into a `contextmenu` event.** `HitArea` treats a touch-originated
  context menu as the long press it was, and starts a selection instead of opening a menu.
- **The tests must not write into the real bucket.** `phpunit.xml` pins
  `DELIVERABLES_DISK=local`; `.env` points at R2 and the suite used to upload into it.
- Uploading a *folder* uses `webkitdirectory` and the entries API. Folders are created first
  (merging into any that already exist by name), then the files are queued.
