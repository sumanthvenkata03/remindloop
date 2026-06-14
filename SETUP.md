# Setup guide

This gets the app running on your phone today. The WhatsApp/cloud parts come in
the next zip — but you can create those accounts now (Step 5) so we're unblocked.

---

## What you need

- **Node.js 20+** on your computer (`node -v` to check).
- The **Expo Go** app on your phone (Play Store). This is what runs the app while
  we develop — no build step, just scan a QR code.

> Note: Expo Go currently runs **Expo SDK 54**, which is exactly what this project
> targets. Local notifications (the kind this app uses) work in Expo Go. The
> full-screen "takeover" alarm and WhatsApp push need a custom build — that's the
> later phase, and we'll set it up then.

---

## Step 1 — Install

```bash
cd app
npm install
```

## Step 2 — Align native versions (important)

```bash
npx expo install --fix
```

This nudges every native package (notifications, storage) to the exact versions
your Expo Go supports. It prevents the most common "it won't load" issues.

## Step 3 — Start

```bash
npx expo start
```

A QR code appears in the terminal.

## Step 4 — Open on your phone

1. Open **Expo Go** on your Galaxy.
2. Scan the QR code.
3. The app loads. The first time, **allow notifications** when asked.

### Try it

1. Tap **+ New reminder**.
2. Type something (or tap the keyboard mic and **speak** it).
3. Tick a few times — try **In 3 hours**, **Tomorrow**, and a **custom day**.
   Watch the preview list update live.
4. Tap **Schedule**. You'll see it on the list with the next time + a count badge.
5. To see a real reminder fire fast: make one for **In 3 hours**… or, for an
   instant test, temporarily lower it (see "Testing quickly" below).
6. When it fires, pull down the notification and tap **✓ Done** or **Snooze**.

---

## Step 5 — Create these accounts in parallel (for the next phase)

All free. You don't need them to run the app today, but having them ready means
the backend phase isn't blocked.

1. **Expo account** — sign up at expo.dev. Needed later to build the installable
   APK (so the app runs without Expo Go and can do the full-screen alarm).
2. **Meta developer account** — developers.facebook.com → create an app → add the
   **WhatsApp** product → note the **test number** → add your own phone as an
   allowed recipient (you'll get a code in WhatsApp to verify).
3. **Anthropic API key** — you already have the `webnexasolutionsllc@gmail.com`
   account; generate a key for Claude (used to parse WhatsApp messages).
4. **AWS account** — for the cloud backend (Lambda, DynamoDB, EventBridge
   Scheduler). Free tier covers everything here.

I'll give exact, click-by-click steps for wiring these when the backend zip lands.

---

## Testing quickly (optional)

Waiting 3 hours to see a notification is no fun. To test instantly, open
`app/src/components/TimingPicker.tsx` and temporarily change the `in3h` preview to
a few seconds out — or just add a throwaway preset. Easiest: in
`app/src/lib/timing.ts`, in `presetDate`, make `in3h` return
`new Date(now.getTime() + 10_000)` (10 seconds). Revert when done.

---

## Troubleshooting

- **App won't load in Expo Go / red screen about versions** → run
  `npx expo install --fix` again, then `npx expo start -c` (clears the cache).
- **`npm install` errors on a package version** → run `npx expo install --fix`
  and retry `npx expo start`. Expo will reconcile the versions.
- **No notification appears** → check the phone allowed notifications for Expo Go,
  and that you're not in Do Not Disturb.
- **Samsung: screen doesn't light up when locked** → Galaxy phones sometimes
  suppress screen-wake when locked to favour Always-On Display. This affects even
  WhatsApp. Settings → Notifications controls lock-screen + pop-up style. The
  guaranteed full-screen wake comes with the native build in the later phase.
- **Reminders drift by a few minutes** → Expo Go uses Android's standard
  (inexact) alarms, which the OS may batch to save battery. Exact-to-the-minute
  timing arrives with the custom dev build (later phase).

---

## Useful commands

```bash
npm run typecheck     # TypeScript check (from /app)
npx expo start -c     # start with a cleared cache
```
