import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { requireEnv, optionalEnv } from './shared/env';
import { verifySignature, sendText, sendButtons } from './shared/whatsapp';
import { parseReminder } from './shared/claude';
import { putReminder, getReminder } from './shared/dynamo';
import { createPingSchedule, deleteSchedule } from './shared/scheduler';
import { Reminder, Ping } from './shared/schema';

const OK: APIGatewayProxyStructuredResultV2 = { statusCode: 200, body: 'ok' };

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmt(d: Date): string {
  return d.toLocaleString('en-US', {
    timeZone: optionalEnv('TZ_NAME', 'America/New_York'),
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method;

  // 1) Webhook verification handshake (Meta sends a GET once)
  if (method === 'GET') {
    const q = event.queryStringParameters ?? {};
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === requireEnv('VERIFY_TOKEN')) {
      return { statusCode: 200, body: q['hub.challenge'] ?? '' };
    }
    return { statusCode: 403, body: 'forbidden' };
  }
  if (method !== 'POST') return { statusCode: 405, body: 'method not allowed' };

  // 2) Verify the signature over the exact raw body
  const raw =
    event.isBase64Encoded && event.body
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body ?? '';
  if (!verifySignature(raw, event.headers['x-hub-signature-256'])) {
    return { statusCode: 401, body: 'bad signature' };
  }

  // 3) Handle the message (always 200 back to Meta so it doesn't retry)
  try {
    const body = JSON.parse(raw);
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return OK; // delivery/read status callbacks, etc.

    const from: string = message.from;

    if (message.type === 'text') {
      await handleText(from, message.text.body);
    } else if (
      message.type === 'interactive' &&
      message.interactive?.type === 'button_reply'
    ) {
      await handleButton(from, message.interactive.button_reply.id);
    } else {
      await sendText(
        from,
        'I can take a reminder as text — try: "renew car registration Sept 30, remind me a week before and the day before".',
      );
    }
  } catch (err) {
    console.error('webhook error', err);
  }
  return OK;
}

async function handleText(from: string, text: string): Promise<void> {
  const parsed = await parseReminder(text);
  if (!parsed) {
    await sendText(from, "Sorry, I couldn't read that. Tell me what to remember and when.");
    return;
  }

  const now = Date.now();
  const times = parsed.fire_times
    .map((s) => new Date(s))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() > now)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!parsed.has_timing || times.length === 0) {
    await sendText(
      from,
      `📌 Got it: "${parsed.title}". When should I remind you? For example: "in 3 hours", "tomorrow at 9am", or "next Monday".`,
    );
    return;
  }

  const id = genId();
  const pings: Ping[] = [];
  for (const t of times) {
    const pingId = genId();
    const scheduleName = `rl-${id}-${pingId}`;
    await createPingSchedule({
      scheduleName,
      fireAt: t,
      payload: { owner: from, reminderId: id, pingId, title: parsed.title },
    });
    pings.push({ id: pingId, fireAt: t.toISOString(), scheduleName, state: 'scheduled' });
  }

  const reminder: Reminder = {
    owner: from,
    id,
    title: parsed.title,
    createdAt: new Date().toISOString(),
    status: 'active',
    source: 'whatsapp',
    pings,
  };
  await putReminder(reminder);

  const lines = times.map((t) => '• ' + fmt(t)).join('\n');
  await sendText(
    from,
    `✅ ${times.length} reminder${times.length > 1 ? 's' : ''} set for "${parsed.title}":\n${lines}`,
  );
}

async function handleButton(from: string, buttonId: string): Promise<void> {
  const [action, reminderId, pingId] = buttonId.split('|');
  const reminder = await getReminder(from, reminderId);
  if (!reminder) return;
  const ping = reminder.pings.find((p) => p.id === pingId);
  if (!ping) return;

  if (action === 'done') {
    // Complete the whole reminder and cancel any still-scheduled pings.
    for (const p of reminder.pings) {
      if (p.state === 'scheduled') {
        if (p.scheduleName) await deleteSchedule(p.scheduleName);
        p.state = 'cancelled';
      }
    }
    ping.state = 'done';
    reminder.status = 'done';
    await putReminder(reminder);
    await sendText(from, `🎉 Marked "${reminder.title}" as done.`);
    return;
  }

  if (action === 'snz1d' || action === 'snz1w') {
    const days = action === 'snz1d' ? 1 : 7;
    const t = new Date(Date.now() + days * 86_400_000);
    const newName = `rl-${reminderId}-${pingId}-s${Date.now().toString(36)}`;
    await createPingSchedule({
      scheduleName: newName,
      fireAt: t,
      payload: { owner: from, reminderId, pingId, title: reminder.title },
    });
    ping.fireAt = t.toISOString();
    ping.scheduleName = newName;
    ping.state = 'scheduled';
    reminder.status = 'active';
    await putReminder(reminder);
    await sendText(from, `😴 Snoozed "${reminder.title}" — I'll remind you ${fmt(t)}.`);
  }
}
