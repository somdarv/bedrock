# The Plan — agreeing work with a client, in the open

> The project management side of Bedrock: a shared list of work per project, and notes pages
> beside it. Decided 2026-09-23. Frontend `src/components/plan/`, API `Admin\PlanController`.

Bedrock already knows the money (quote, invoice, gates) and the work itself (the file
repository). What it did not hold is the agreement: what we said we would do, what the client
asked for afterwards, what we said no to, and who is holding the next move. That lived in
WhatsApp, where it cannot be found six weeks later.

The Plan is that record, and both sides read the same one.

## What was decided

| Question | Decision |
|---|---|
| Plan and priced scope | **Two lists.** The quote's line items stay exactly as they are. The plan carries no prices and never changes an invoice. |
| What a client can do | **Approve, request, comment.** They never tick our work done. A request lands on our side as `proposed`. |
| Proving it was them | **The link is enough**, as it already is for files. An action records the name they type, and says it came from the project link. No code, no login. |
| Notes | **A fuller editor**: headings, styled text, lists, tick boxes, tables, inline images, links. |

The two-list decision is the load-bearing one: agreeing an extra item does **not** bill for it.
When an agreed item deserves money, it is added to the quote or raised as an invoice by hand,
the way it is done today. Keeping the plan out of the money model means a task list can never
corrupt a balance.

## An item

The unit is one short line of work, not a document.

```
title          "Three backdrop concepts"
note           a few lines, optional
state          proposed → agreed → doing → done → shelved
waiting_on     us | client          who owes the next move
raised_by      us | client          who asked for it
visibility     shared | internal    internal never reaches the client link
due_date       optional
approved_*     when a client signs it off: name, and when
shelved_reason why it was parked, in our words
files          deliverables filed against this item
comments       short back and forth, either side
```

Five states cover what the studio actually does: propose it, agree it, work on it, finish it,
or park it. `shelved` is the one that earns its place. Work refused or postponed disappears from
every other tool, and then the argument has no record.

**Waiting on** is the second load-bearing field. A studio of one chases content, logos and
approvals more than it chases work. "Waiting on the client" turns that into a list instead of a
memory.

## What each side sees

**Ours** (`/admin/packages/{id}/plan`, and a summary on the project page): every item, internal
ones included, grouped by state, with a quick add at the top. Filters for what is waiting on
them, what they raised, and what is shelved.

**Theirs** (on the project link, under the money and beside the files): shared items only,
grouped as plain English. They can:

- **approve** an item we have marked done, which records their name and the moment;
- **request** something, which arrives as `proposed`, raised by them, waiting on us;
- **comment** on any shared item.

Every one of those writes to the project's activity log, so the operator's timeline stays the
single history.

## Notes pages

Each project holds pages: "Brief", "Content we need", "Meeting 12 Sep". A page is `shared` or
`internal`. The editor takes headings, bold and italic, lists, tick boxes, tables, links and
images pasted or dropped inline. Images land in the project's file repository, so a picture in a
note is a file like any other, and the client sees a shared page exactly as it was written.

This is the one part deliberately bought rather than built: a block editor with tables and
images is months of edge cases (selection, paste, undo, mobile carets). The document format is
stored as JSON so the page is never trapped in someone's HTML.

## Order of work

1. **The plan itself — built 2026-09-23.** Items, the five states, both sides, comments, files
   filed against an item, and the client's approve and request. `Admin\PlanController` and
   `PortalPlanController` on the API; `src/components/plan/` and `src/lib/plan/` on the hub.
   It appears on the project page, on `/admin/packages/{id}/plan`, and on the client's link.
   Guarded by `tests/Feature/PlanTest.php`.
2. **Notes pages** with the editor, shared or internal, images into the repository. Not started.
   The editor is a dependency decision: a block editor with tables and inline images is bought,
   not built, and the document is stored as JSON so the page is never trapped in someone's HTML.
3. **A board view** (columns, drag between states, reusing the file browser's drag) and a
   cross-project chase list: everything waiting on a client, everywhere. Not started.

## Rules this has to keep

- **The plan never touches money.** No item carries a price, and nothing here changes a total,
  an invoice or a gate.
- **Internal is internal.** Visibility is enforced in the API, not by hiding rows in the
  browser, the same way the download gate is.
- **A client's word is recorded as what it is.** An approval says it came from the project link
  with the name they gave. It is a record, not an identity check, and the copy says so.
- **It reads on a phone**, because that is where the client is.
