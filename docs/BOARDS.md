# Boards

Drawings we put in front of a client by private link. They drop numbered pins on a drawing
and write under each one. We answer from the admin and mark each pin done.

Built on 10/11/2026 as a stop-gap for Isaac (Slatebod) until the client studio is decided.
It has no voice notes, drawing on screenshots, video or alerts yet. Those belong to the
studio.

## Where things are

| Part | Where |
|---|---|
| The client's page | `hub.saharabasetech.com/board/<token>` |
| Our list | `/admin/boards` |
| Our view of one board | `/admin/boards/<id>` |
| One frame's page | `/board/<token>/frames/<frameId>`, or `/admin/boards/<id>/frames/<frameId>` with the session |
| Screen | `src/components/boards/` |
| Server actions | `src/lib/boards/actions.ts` |
| API | `bedrock-api`: `BoardController`, `Admin\BoardController`, `Services/Boards/BoardWriter.php` |
| Tables | `boards`, `board_frames`, `board_pins`, `board_comments` |

## The rules it keeps

- **The link is the key.** Whoever holds it can look at every frame, drop a pin and reply. The
  name they type is a record, not an identity check, as on the Plan. Only we mark a pin done,
  and only we turn the link off.
- **A client reply opens a closed pin again.** If they write under it, it is not done for them.
- **A frame's page runs no script.** The board shows it in an `iframe` with `sandbox` set and no
  permissions. The page's own response carries a CSP with `sandbox` too, so opening the address
  on its own runs nothing either. It may load pictures over https or from `data:`, and styles and
  fonts from Google Fonts. Nothing else loads.
- **A pin keeps the version it was dropped on.** Pushing a changed page raises the frame's
  version. The thread then says the pin was left on an earlier version.
- **The board polls every 20 seconds** while it is on screen, so both sides see new replies.
- **What a phone keeps.** The typed name and any comment not yet sent stay in that device's
  storage. A private window forgets them.

## Making a board

On the API server, as `sahara`, in `~/apps/hub-api`:

```sh
php artisan boards:create "Laptop layouts, round 2" --for=Isaac
```

It prints the board's id and the link to send.

## Writing frames

A board folder holds a `board.json` and one HTML page per frame:

```json
{
  "title": "Laptop layouts, round 2",
  "forName": "Isaac",
  "pages": [{ "id": "student", "name": "Student" }, { "id": "admin", "name": "Institute admin" }],
  "notes": [{ "x": 0, "y": -260, "text": "Assignments", "page": "student" }],
  "frames": [
    { "file": "student-home.html", "title": "Home", "page": "student", "x": 0, "y": 0, "w": 1280, "h": 900 },
    { "file": "student-enrol.html", "title": "Enrol", "page": "student", "x": 1360, "y": 0, "w": 1280, "h": 900 }
  ]
}
```

- `x`, `y`, `w` and `h` are CSS pixels on the board. Leave 80 between frames in a row and 160
  between rows. A note is a row title, drawn 72px tall: put it about 260 above its row, so the
  frames' name strips stay clear of it at any zoom.
- A frame's key is its file name. Keep the name when you redraw a frame, or its pins are lost.
- Each page is a whole HTML document, drawn at exactly `w` by `h`. Put `body { margin: 0 }`
  and give the root that size.
- No scripts: they do not run. Lay everything out in HTML and CSS.
- Fonts from Google Fonts. Pictures as https addresses or written in as `data:` URIs. A page
  may be up to 6 MB.
- `pages` and `notes` are optional. Without `pages` the board has no tabs.

## Putting frames on a board

From a machine with the `sahara` SSH alias, copy the folder up and push it:

```sh
B=<board token or id>; DIR=<local board folder>; NAME=<short folder name>
tar -C "$DIR" -cf - . | ssh sahara "rm -rf ~/boards-in/$NAME && mkdir -p ~/boards-in/$NAME && tar -C ~/boards-in/$NAME -xf - && cd ~/apps/hub-api && php artisan boards:push $B ~/boards-in/$NAME"
```

It says how many frames were added, changed, the same and removed. Pushing the same folder
twice changes nothing. Add `--prune` to remove frames the folder no longer has, with their pins.

`boards:push` also takes a bundle file, or `-` for a bundle on stdin. A bundle is the same JSON
with each frame's page in `html` instead of `file`.

## Reading what was said

```sh
ssh sahara "cd ~/apps/hub-api && php artisan boards:comments <board> --open"
```

`--since="2026-11-10 12:00"` keeps pins talked on since then, and `--json` prints JSON for a
script. `boards:list` shows every board with its open pins and link.

## Housekeeping

- Turn a board's link off from its admin view. The board and its talk stay, and the link
  answers "This link is not active".
- `php artisan boards:remove <board>` deletes a board with everything on it. Use it for a test
  board, not for one a client has used.
