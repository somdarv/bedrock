# Template header images

WhatsApp **media (image) headers must be sent with every message** — the image uploaded in Meta is
only the approval sample. Bedrock sends each branded template's header as a link to a file in **this
folder**, served publicly at `https://hub.saharabasetech.com/brand/headers/<file>` (spaces are
URL-encoded), which Meta fetches at send time.

Current mapping (`bedrock-api/config/notifications.php`):

| File | Template |
|------|----------|
| `Welcome Header.png` | `client_individual_welcome`, `client_welcome_contact` |
| `Deposit Received.png` | `deposit_received` |
| `Files Received.png` | `files_ready` |
| `Package Delivered.png` | `package_delivered` |
| `payment complete.png` | `payment_complete` |

Notes:
- The frontend must be **deployed** for Meta to reach these (a template with an image header fails to
  send if the image is unreachable).
- `invoice_sent` has **no image header** (no invoice card). Its invoice PDF is an **email attachment**
  (`attachment` in config) when `PDF_ATTACHMENTS_ENABLED=true`, not a WhatsApp header.
- `payment_complete` uses the image header on WhatsApp **and** attaches the receipt PDF to email
  (when PDF attachments are enabled).
