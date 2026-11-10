# Boards

A canvas we put in front of a client by private link, laid out and worked like the Claude
design canvas. Our designs sit on it as frames. The client can move around it, draw on it, and
leave a comment anywhere: on the canvas, on a whole design, on one block inside a design, or on
something drawn. We answer from the admin and resolve each comment.

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
| Screen | `src/components/boards/`: `board-view` (the screen), `board-canvas` (moving, zooming, the tools), `board-marks` (how drawings look), `board-toolbar`, `board-panel` (comments) |
| Drawing geometry | `src/lib/boards/marks.ts` |
| Finding the block under the pointer | `src/lib/boards/inspect.ts` |
| Server actions | `src/lib/boards/actions.ts` |
| API | `bedrock-api`: `BoardController`, `Admin\BoardController`, `Services/Boards/BoardWriter.php` |
| Tables | `boards`, `board_frames`, `board_pins`, `board_comments`, `board_marks` |

## The rules it keeps

- **The link is the key.** Whoever holds it can look at every frame, drop a pin and reply. The
  name they type is a record, not an identity check, as on the Plan. Only we mark a pin done,
  and only we turn the link off.
- **A client reply opens a closed pin again.** If they write under it, it is not done for them.
- **A frame's page runs no script.** The board shows it in an `iframe` with `sandbox` set to
  `allow-same-origin` only. The page's own response carries a CSP with `sandbox allow-same-origin`
  too, so opening the address on its own runs nothing either. `allow-same-origin` is there so the
  board can read the page's layout and find the block under the pointer. **Never add
  `allow-scripts` beside it**: together they would let a page act on the hub as its viewer. A page
  may load pictures over https or from `data:`, and styles and fonts from Google Fonts. Nothing
  else loads.
- **Everyone on the board may draw, move and remove drawings,** ours too, as on the Claude canvas.
  A removal is soft (`deleted_at`), so undo brings it back. A drawing keeps the name of whoever
  made it. The browser makes each drawing's id, so it can be moved before its first save is back,
  and saves for one drawing run in order.
- **A pin keeps the version it was dropped on.** Pushing a changed page raises the frame's
  version. The thread then says the pin was left on an earlier version.
- **The board polls every 15 seconds** while it is on screen, so both sides see new replies and
  drawings. A drawing still saving, or being typed in, keeps its local state over the poll.

## Working the canvas

As on the Claude canvas. Shortcuts in brackets.

- **Move and zoom.** Space and drag, the wheel button and drag, the hand (H), or two fingers on a
  trackpad. A plain drag never moves the canvas: it selects. Pinch or Ctrl and the wheel zooms, as
  do Ctrl + and Ctrl -. The zoom menu has Fit artboards (Shift 1), Zoom to selection (Shift 2),
  25% to 200% (100% is Shift 0), Undo and Redo.
- **Select (V).** A click on a design picks the outermost block under the pointer; a double click
  goes one level in; Escape goes back out. A click on a drawing picks it; Shift and a click adds
  or takes away one. A drag draws a box: it picks every drawing it touches, or, with none under
  it, the area of the design (or the canvas) it covers, ready for a comment. Dragging what is
  selected moves it all; handles resize one drawing; arrows nudge (Shift for 10); Delete removes;
  Enter edits text. A bar over the selection has the colour and line width, the size and bold for
  text and notes, Comment (C), Zoom to selection and Remove.
- **Text and notes.** Double click to type. Select words and press Ctrl B, or B on the bar above,
  to bold them; A- and A+ set the size of the whole text. Bold is kept as **two stars** round the
  words, so the server and `boards:comments` see plain text.
- **Draw.** Text (T), Artboard (A, a white frame with a name), Note (N), Pencil (P), Pen (Shift P:
  click the points, Enter or a double click ends it), Rectangle (R), Oval (O), Arrow (Shift L),
  Line (L). Shift keeps shapes square and lines to 45 degrees. A drag sets the size; a click makes
  a standard one. Ctrl Z undoes, Ctrl Shift Z redoes; moving several drawings is one step.
- **Comment.** The bubble at the top right, or C, turns comment mode on. The design and the block
  under the pointer get an amber outline. A click drops the comment on that block, on a drawing,
  or on the empty canvas; a drag puts it on the area dragged out. With something selected, C
  comments on the selection. What a comment is about is outlined while its thread is open.
- **On a phone** the tools sit along the bottom. With the select tool one finger moves the canvas,
  since a phone has no Space or wheel button; with a drawing tool it draws, and in comment mode a
  drag marks an area. Two fingers always pinch and move.
- **What a phone keeps.** The typed name and any comment not yet sent stay in that device's
  storage. A private window forgets them.

## Making a board

On the API server, as `sahara`, in `~/apps/hub-api`:

```sh
php artisan boards:create "Laptop layouts, round 2" --for=Isaac --client=infralearn
```

It prints the board's id and the link to send. `--client` ties the board to a client by its id
or a part of its name that fits one client; the admin list then shows the client's name.

## Bringing a Claude canvas across

`scripts/canvas-to-board.cjs` turns a Claude Design canvas into a board folder. Read the canvas's
`project/canvas.json` and every `project/*.dc.html` with the Artifact tool, and each picture by
its asset id (`/_blob/<id>` in the pages) one at a time, then:

```sh
node scripts/canvas-to-board.cjs <folder holding project/> <folder of the <id>.jpg pictures> <out folder>
```

Each artboard's `renderVals()` runs and its `sc-for`, `sc-if` and `{{holes}}` are written out,
so the frame is a plain page whose blocks can be picked. An artboard named `*-today` (prod
beside beta) becomes its beta half alone, the screenshot written into the page, set where the
beta half stood. Titles and grey notes come across as board notes. Push the folder as below.

## The inbox

What clients said and drew on any board since we last looked.

- **The owner:** the top of `/admin/boards`, "New from clients". Each comment opens its board on
  that comment. "Mark these read" moves the owner's place on.
- **An assistant:** `php artisan boards:inbox` on the API server. It prints each comment with its
  board, frame, the block or area it is about, and the talk before it. `--json` for a script,
  `--mark` to move the place on once read, `--since="2026-11-10 12:00"` to look again from a time.
- Each reader keeps its own place (`board_reads`: `owner`, `agent`), so one reading never hides
  a comment from the other.

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

Each pin says where it sits: on a design and the block's words and CSS path, on a drawing, or on
the canvas with its page. `--since="2026-11-10 12:00"` keeps pins talked on since then, and `--json` prints JSON for a
script. `boards:list` shows every board with its open pins and link.

## Housekeeping

- Turn a board's link off from its admin view. The board and its talk stay, and the link
  answers "This link is not active".
- `php artisan boards:remove <board>` deletes a board with everything on it. Use it for a test
  board, not for one a client has used.
