import { createHmac, timingSafeEqual } from 'crypto';
import { requireEnv, optionalEnv } from './env';

const endpoint = () =>
  `https://graph.facebook.com/${optionalEnv('GRAPH_VERSION', 'v21.0')}/${requireEnv(
    'PHONE_NUMBER_ID',
  )}/messages`;

async function post(body: unknown): Promise<void> {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('WHATSAPP_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('WhatsApp send failed', res.status, await res.text());
  }
}

export async function sendText(to: string, body: string): Promise<void> {
  await post({ messaging_product: 'whatsapp', to, type: 'text', text: { body } });
}

export interface ReplyButton {
  id: string;
  title: string;
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: ReplyButton[],
): Promise<void> {
  await post({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        // WhatsApp allows up to 3 reply buttons; titles max 20 chars
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

/** Verify Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifySignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const expected =
    'sha256=' + createHmac('sha256', requireEnv('APP_SECRET')).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
