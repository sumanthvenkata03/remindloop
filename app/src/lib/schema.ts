import { z } from 'zod';

/**
 * The reminder data contract.
 * This same schema will be reused by the AWS backend in the next phase,
 * so the app and the cloud always agree on shape. Keep it the source of truth.
 */

export const PingState = z.enum([
  'scheduled', // a notification is set and waiting to fire
  'fired', // it fired (informational)
  'done', // user marked it done
  'snoozed', // user snoozed it (a new scheduled ping replaces it)
  'cancelled', // reminder deleted / ping removed
]);
export type PingState = z.infer<typeof PingState>;

export const Ping = z.object({
  id: z.string(),
  fireAt: z.string(), // ISO timestamp
  notificationId: z.string().optional(), // expo's scheduled-notification id, so we can cancel it
  state: PingState,
});
export type Ping = z.infer<typeof Ping>;

export const Channel = z.enum(['app', 'whatsapp']);
export type Channel = z.infer<typeof Channel>;

export const Reminder = z.object({
  id: z.string(),
  title: z.string().min(1),
  notes: z.string().optional(),
  createdAt: z.string(), // ISO timestamp
  status: z.enum(['active', 'done']),
  channels: z.array(Channel).min(1),
  pings: z.array(Ping),
});
export type Reminder = z.infer<typeof Reminder>;

export const Reminders = z.array(Reminder);
export type Reminders = z.infer<typeof Reminders>;
