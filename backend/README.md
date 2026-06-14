# RemindLoop backend (Phase 3a)

The cloud brain for the **WhatsApp** channel. You message your WhatsApp bot in
plain language; this parses it with Claude, stores it in DynamoDB, schedules the
pings with EventBridge Scheduler, and delivers them back to WhatsApp with
**Done / Snooze** buttons.

> Scope note: 3a makes WhatsApp a fully working channel **on its own**. It does not
> yet share data with the phone app's on-device store — unifying the two is Phase 3b.

---

## How it works

```
You (WhatsApp) --"remind me to call mom tomorrow 6pm and in 1 week"-->
   Webhook Lambda (Function URL)
     |- verifies Meta's signature
     |- Claude Haiku -> { title, fire_times[] }
     |- DynamoDB <- reminder record
     '- EventBridge Scheduler <- one one-time schedule per time
                                   |
                          (at each time)
                                   v
                          Sender Lambda -> WhatsApp message
                                          "Call mom"  [Done][Snooze 1d][Snooze 1w]
                                   |
                       you tap a button --> Webhook Lambda -> update / reschedule
```

---

## Prerequisites

- **Node.js 20+** and the repo cloned.
- An **AWS account** with the **AWS CLI configured** (`aws configure`). Check with
  `aws sts get-caller-identity`.
- Your **Meta WhatsApp** credentials - follow **WHATSAPP_SETUP.md** first.
- An **Anthropic API key** from console.anthropic.com.

---

## Deploy steps

### 1. Install
```bash
cd backend
npm install
```

### 2. Fill in secrets
```bash
cp .env.example .env
```
Open `.env` and paste in the five values (four from WHATSAPP_SETUP.md, plus your
Anthropic key). **Never commit `.env`** - it's gitignored, and this repo is public.

### 3. Bootstrap CDK (one time per AWS account + region)
Creates the small bucket/role CDK uses to deploy. You only do this once.
```bash
npx cdk bootstrap
```

### 4. Deploy
```bash
npm run deploy
```
Approve the IAM changes when prompted. When it finishes it prints outputs -
**copy the `WebhookUrl`** (looks like `https://xxxx.lambda-url.us-east-1.on.aws/`).

### 5. Connect the webhook in Meta
Go back to **WHATSAPP_SETUP.md -> "After deploy"** and paste the `WebhookUrl` +
your `VERIFY_TOKEN` into Meta's Configuration page, then subscribe to the
**messages** field.

### 6. Test it
From the phone you registered as a recipient, message your bot:

> remind me to test RemindLoop in 2 minutes

You should get a confirmation, then ~2 minutes later a reminder with buttons. Tap
**Done** and you'll get a confirmation back.

---

## Costs

Everything here sits in the AWS always-free tier at personal volume: Lambda (1M
free req/mo), DynamoDB (25 GB free), EventBridge Scheduler (14M free
invocations/mo). The only real cost is Claude Haiku parsing - about **$0.001 per
reminder**. Realistic bill: a few cents a month.

---

## Security notes

- The webhook URL is public, but every POST is rejected unless Meta's
  `X-Hub-Signature-256` matches (HMAC with your App Secret).
- Secrets live only in `.env` locally and as Lambda env vars in your own AWS
  account. **Hardening for later:** move `WHATSAPP_TOKEN`, `ANTHROPIC_API_KEY`,
  and `APP_SECRET` to SSM SecureString and fetch them at runtime - because
  `src/shared/env.ts` centralizes env access, that's a one-file change.
- The IAM role is least-privilege (DynamoDB on the one table, scheduler
  create/delete, and PassRole limited to the scheduler role only).
- Don't put passwords or account numbers in reminders.

---

## Common commands
```bash
npm run deploy     # deploy / redeploy after code changes
npm run diff       # preview what a deploy would change
npm run destroy    # tear everything down (DynamoDB table is deleted too)
npm run typecheck  # TypeScript check
```

## Troubleshooting

- **`cdk bootstrap` or deploy fails with credentials error** -> run
  `aws configure` and confirm `aws sts get-caller-identity` works.
- **Meta "Callback URL could not be validated"** -> the `VERIFY_TOKEN` in `.env`
  must exactly match what you type in Meta's Configuration page; redeploy if you
  changed `.env`.
- **No reply when you message the bot** -> check the Webhook Lambda's logs in
  CloudWatch (Console -> Lambda -> Webhook -> Monitor -> View logs). Common causes:
  expired WhatsApp token (regenerate), wrong `PHONE_NUMBER_ID`, or you haven't
  subscribed to the **messages** webhook field.
- **Reminder never fires** -> confirm the schedule exists (Console -> EventBridge
  -> Schedules) and check the Sender Lambda's logs.
