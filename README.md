# RemindLoop

A personal "dump it and forget it" reminder system. Capture anything in plain
language, pick when to be nudged, and get reminded — first in a native app on
your phone, and (next phase) in WhatsApp too.

Built for one user. Free to run. React Native (Expo) on the front, AWS on the back.

---

## The two ways you get reminded

1. **The app** (this repo, `/app`) — on-device notifications that wake the screen
   and carry **Done / Snooze** buttons. Works offline. No server needed for these.
2. **WhatsApp** (next phase, `/backend` + `/infra`) — pings sent from the cloud,
   so you can also capture and receive reminders right inside WhatsApp.

A shared data shape (the Zod schema in `app/src/lib/schema.ts`) keeps both sides
in agreement, so your reminders stay consistent and searchable across years.

---

## Phase status

| Phase | What | Status |
|---|---|---|
| 1 | Monorepo, shared schema, docs | ✅ in this zip |
| 2 | App MVP: capture, multi-select timing picker, list, detail, delete, local reminders w/ Done/Snooze | ✅ in this zip |
| 3 | AWS backend + WhatsApp: webhook, Claude parsing, store, scheduler, WhatsApp Flow pop-up, app↔cloud sync | ⏳ next zip |
| 4 | Polish: full-screen alarm takeover (dev build), voice notes, plain-language management, recurring, quiet hours | ⏳ later |

**You can use Phase 2 on its own today.** It's a complete on-device reminder app.

---

## Repo map

```
remindloop/
├─ app/                 # the React Native (Expo) app — RUN THIS
│  ├─ App.tsx           # navigation + reminder CRUD + notification handling
│  ├─ src/
│  │  ├─ lib/           # schema (Zod), timing math, storage, notifications
│  │  ├─ components/    # UI primitives + the TimingPicker (the multi-select)
│  │  └─ screens/       # List, Capture, Detail
│  └─ app.json          # Expo config
├─ backend/             # (Phase 3) AWS Lambda + WhatsApp — stub for now
├─ infra/               # (Phase 3) IaC for AWS — stub for now
├─ packages/shared/     # the contract both app and backend will share
└─ docs/                # architecture & decisions
```

---

## Quick start

See **SETUP.md** for the full, step-by-step guide (including the accounts to
create in parallel). The short version:

```bash
cd app
npm install
npx expo install --fix   # aligns native package versions to your Expo Go
npx expo start
```

Then open **Expo Go** on your phone and scan the QR code.

---

## Design

Warm near-black with a single amber accent — an "alarm bell at night" feel,
deliberately not the usual blue-utility look. One accent colour, generous space,
big tap targets sized for a foldable. Tokens live in `app/src/theme.ts`.
