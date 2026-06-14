# Architecture

## The core idea

Two delivery channels, one shared notion of what a "reminder" is.

```
                       ┌─────────────────────────────┐
                       │   Reminder (shared schema)   │
                       │   id, title, pings[], …      │
                       └─────────────────────────────┘
                          ▲                       ▲
            on-device     │                       │   cloud
        ┌─────────────────┘                       └──────────────────┐
        │                                                            │
┌───────────────┐                                          ┌──────────────────┐
│  App (Expo)   │                                          │  AWS backend      │
│  - capture    │   ── sync (Phase 3) ──►                  │  - WhatsApp webhook│
│  - timing UI  │   ◄── sync (Phase 3) ──                  │  - Claude parse    │
│  - local pings│                                          │  - store + schedule│
│  Done/Snooze  │                                          │  - WhatsApp send   │
└───────────────┘                                          └──────────────────┘
        │                                                            │
        ▼                                                            ▼
  Phone notification                                          WhatsApp message
  (wakes screen, buttons)                                     (with quick replies)
```

## Why split it this way

- **App reminders are scheduled on the phone itself.** This is the key reason the
  app works offline and fires instantly — no round trip to a server, no push
  infrastructure. Each ping is a local scheduled notification. The OS owns the
  timer; we just store the notification id so we can cancel it.

- **WhatsApp reminders must come from a server.** You can't have a phone reliably
  send you a WhatsApp message at a future time while it's asleep. So a small cloud
  brain owns: receiving your WhatsApp messages, understanding them (Claude),
  storing them, scheduling the future send, and sending it.

- **One schema, two consumers.** `app/src/lib/schema.ts` (Zod) is the contract.
  In Phase 3 it gets promoted to `packages/shared` and imported by both sides so
  they can never drift.

## Phase 2 (this zip) — on-device, in detail

```
Capture screen ──► TimingPicker ──► Date[] (de-duped, sorted, future-only)
       │
       ▼
App.createReminder()
   for each time: Notifications.scheduleNotificationAsync({ trigger: DATE })
   store Reminder{ pings:[{ fireAt, notificationId, state }] } in AsyncStorage
       │
       ▼
OS fires notification at fireAt  (channel: MAX importance → heads-up + lock screen)
       │
       ▼
User taps a button on the notification
   DONE       → ping.state = 'done'  (whole reminder done if no pings left)
   SNOOZE_1D  → schedule a new ping +1 day, update record
   SNOOZE_1W  → schedule a new ping +7 days, update record
       │
       ▼
addNotificationResponseReceivedListener handles it (or getLastNotificationResponseAsync on cold start)
```

### Honest limitation in Phase 2

Action buttons are set to not open the app. While the app is alive, the JS handler
runs immediately. If the app was fully killed when you tap **Done/Snooze**, Android
records the action and we reconcile it the next time the app launches (via
`getLastNotificationResponseAsync`). For a single-user reminder app this is fine;
the rock-solid, always-on version of Done/Snooze comes for free once the backend
exists (the server can update state regardless of the app).

## Phase 3 (next) — the cloud brain on AWS

- **Lambda Function URL** — the public webhook Meta calls when you message the bot.
  Verifies Meta's `X-Hub-Signature-256` and ignores any sender that isn't you.
- **Claude (Haiku)** — turns "remind me about groceries" into structured JSON
  `{ title, timing }`. If timing is missing, the bot replies with a **WhatsApp
  Flow** containing the same multi-select you see in the app.
- **DynamoDB** — the permanent, searchable store of every reminder (years of dumps).
- **EventBridge Scheduler** — one one-time schedule per ping; it auto-deletes after
  firing. The cleanest possible model for "fire this once at this exact time."
- **Sync** — the app pulls/pushes reminders so both channels agree.

### Why AWS (vs Cloudflare)

Both are free at this scale. AWS was chosen because it doubles as hands-on practice
for the SAA-C03 / AIF-C01 path, and EventBridge Scheduler is a textbook-clean fit
for arbitrary one-time scheduling. (Cloudflare Workers + Durable Object alarms could
do the same for $0 — a fine alternative if priorities change.)

## Data model

See `app/src/lib/schema.ts`. A `Reminder` has many `Ping`s. Each `Ping` is one
scheduled notification with its own `fireAt`, `state`, and (on device) the
`notificationId` used to cancel it. `channels` records where a reminder is
delivered (`app` now; `app` + `whatsapp` once the backend lands).
