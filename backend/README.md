# Backend (Phase 3 — not built yet)

This will hold the AWS cloud brain for the WhatsApp channel:

- **Lambda Function URL** — WhatsApp webhook (verifies Meta's signature; ignores
  any sender that isn't you).
- **Claude (Haiku)** — parses plain-language messages into the shared Reminder
  schema; when timing is missing, replies with a WhatsApp Flow (the multi-select
  pop-up, same as the app).
- **DynamoDB** — permanent, searchable reminder store.
- **EventBridge Scheduler** — one one-time schedule per ping; auto-deletes on fire.
- **WhatsApp send** — delivers the reminder with Done/Snooze quick replies.
- **Sync endpoint** — so the app and cloud share state.

The Reminder contract is already defined in `app/src/lib/schema.ts` and will be
promoted to `packages/shared` so the backend imports the exact same Zod types.

Accounts to have ready (see ../SETUP.md Step 5): Meta developer app + WhatsApp
test number, Anthropic API key, AWS account.
