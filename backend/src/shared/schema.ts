import { z } from 'zod';

/**
 * Cloud-side reminder contract. Mirrors the app's schema, with two extra fields
 * the server needs: `owner` (the WhatsApp number this belongs to) and `source`.
 * In Phase 3b this and the app schema get unified into packages/shared.
 */

export const PingState = z.enum(['scheduled', 'fired', 'done', 'snoozed', 'cancelled']);
export type PingState = z.infer<typeof PingState>;

export const Ping = z.object({
  id: z.string(),
  fireAt: z.string(), // ISO timestamp
  scheduleName: z.string().optional(), // EventBridge Scheduler name, so we can delete it
  state: PingState,
});
export type Ping = z.infer<typeof Ping>;

export const Reminder = z.object({
  owner: z.string(), // WhatsApp sender id (the phone)
  id: z.string(),
  title: z.string().min(1),
  createdAt: z.string(),
  status: z.enum(['active', 'done']),
  source: z.enum(['app', 'whatsapp']),
  pings: z.array(Ping),
});
export type Reminder = z.infer<typeof Reminder>;
