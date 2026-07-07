# Template header images

WhatsApp **media (image) headers must be sent with every message** — the image you upload in Meta
is only the approval sample. So Bedrock sends each branded template's header image as a link to a
file in **this folder** (served publicly at `https://hub.saharabasetech.com/headers/<file>`), which
Meta fetches at send time.

Drop the branded header PNGs here with these **exact filenames** (mapped in
`bedrock-api/config/notifications.php`):

| File | Used by template(s) |
|------|---------------------|
| `welcome.png` | `client_individual_welcome`, `client_welcome_contact` |
| `deposit-received.png` | `deposit_received` |
| `files-ready.png` | `files_ready` |
| `package-delivered.png` | `package_delivered` |

Guidance: landscape (e.g. ~1125×600), PNG or JPG, < 5 MB. The image must be **publicly reachable**
(the frontend must be deployed) for Meta to fetch it. A template with an image header will fail to
send if its image is missing/unreachable.

`invoice_sent` and `payment_complete` currently use a **document (PDF)** header (the invoice/receipt),
gated by `PDF_ATTACHMENTS_ENABLED`. If you instead gave them an **image** header in Meta, tell the
build to switch them to an image header + add their PNGs here.
