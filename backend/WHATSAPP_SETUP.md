# WhatsApp (Meta) setup

This gets you the five values for `backend/.env` and connects your webhook. All
free — it uses Meta's WhatsApp Cloud API **test number**, so no SIM and nothing
touches your personal WhatsApp except receiving messages.

You'll end up with:

| `.env` key | Where it comes from |
|---|---|
| `PHONE_NUMBER_ID` | WhatsApp > API Setup |
| `WHATSAPP_TOKEN` | WhatsApp > API Setup (temporary) or a System User (permanent) |
| `APP_SECRET` | App Settings > Basic |
| `VERIFY_TOKEN` | **You invent it** (any random string) |
| `ANTHROPIC_API_KEY` | console.anthropic.com (not Meta) |

---

## Part A — before you deploy

### 1. Create a Meta developer account + app
- Go to **developers.facebook.com** and sign up / log in.
- **My Apps → Create App**. Choose the **Business** app type. Name it (e.g.
  "RemindLoop"). You do **not** need to create or verify a Business Account — a
  test setup is enough.

### 2. Add the WhatsApp product
- On the app dashboard, find **WhatsApp** and click **Set up**.
- This gives you a free **test phone number** (the sender) and an **API Setup** page.

### 3. Grab the Phone number ID and a token
On **WhatsApp → API Setup**:
- Copy **Phone number ID** → this is `PHONE_NUMBER_ID` (it's the long number, NOT
  the human phone number).
- Copy the **Temporary access token** → this is `WHATSAPP_TOKEN`.
  - ⚠️ The temporary token **expires in 24 hours** — fine for first testing. For
    something that keeps working, create a **System User** with a permanent token
    (Business Settings → Users → System Users → add → generate token with
    `whatsapp_business_messaging` + `whatsapp_business_management`). Paste that
    instead and you won't have to refresh it.

### 4. Register your phone as a recipient
- Still on API Setup, under **To**, add **your own phone number** and confirm the
  code WhatsApp sends you. The test number can only message numbers you add here
  (up to 5).

### 5. Get the App Secret
- **App Settings → Basic → App Secret → Show**. Copy it → this is `APP_SECRET`.

### 6. Invent a Verify Token
- Make up any random string, e.g. `rl_9f2c7q_verify`. Put it in `.env` as
  `VERIFY_TOKEN`. You'll type the **same** value into Meta in Part B.

### 7. Anthropic key
- At **console.anthropic.com**, create an API key → `ANTHROPIC_API_KEY`.

Now your `.env` has all five values. Go run the deploy (backend/README.md steps
3–4) and copy the **`WebhookUrl`** it prints.

---

## Part B — after you deploy

### 8. Set the callback URL
- Back in the app dashboard: **WhatsApp → Configuration**.
- **Callback URL** = the `WebhookUrl` from the deploy output.
- **Verify token** = the exact `VERIFY_TOKEN` you put in `.env`.
- Click **Verify and save**. Meta calls your webhook's GET handler; if the tokens
  match it succeeds. (If it fails, the token doesn't match — fix `.env`, redeploy,
  try again.)

### 9. Subscribe to messages
- On the same Configuration page, under **Webhook fields**, click **Manage** and
  **subscribe to `messages`**. This is what makes Meta forward incoming texts and
  button taps to your webhook.

### 10. Send a test
- Open WhatsApp on your registered phone, find the test-number chat (save it as a
  contact like "RemindLoop"), and send:
  > remind me to test RemindLoop in 2 minutes
- You should get a confirmation, then the reminder with **Done / Snooze** buttons.

---

## Notes & gotchas

- **24-hour window:** WhatsApp lets a business reply freely only within 24h of your
  last message. Since you're messaging the bot to create reminders, replies work.
  A reminder that fires more than 24h after your last message may require an
  approved **template** — for personal testing you'll usually have messaged it
  recently, so this rarely bites. Template support can be added later.
- **Pick your 5 recipient numbers carefully** — the test number is limited to the
  numbers you verify.
- **Keep `.env` private.** It holds your tokens and this repo is public.
