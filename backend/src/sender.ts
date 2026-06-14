import { sendButtons } from './shared/whatsapp';
import { getReminder, putReminder } from './shared/dynamo';

/** Payload that EventBridge Scheduler delivers when a ping fires. */
interface PingEvent {
  owner: string;
  reminderId: string;
  pingId: string;
  title: string;
}

export async function handler(event: PingEvent): Promise<void> {
  const { owner, reminderId, pingId, title } = event;

  await sendButtons(owner, `⏰ Reminder: ${title}`, [
    { id: `done|${reminderId}|${pingId}`, title: '✓ Done' },
    { id: `snz1d|${reminderId}|${pingId}`, title: 'Snooze 1 day' },
    { id: `snz1w|${reminderId}|${pingId}`, title: 'Snooze 1 week' },
  ]);

  // Best-effort: record that this ping fired.
  try {
    const reminder = await getReminder(owner, reminderId);
    if (reminder) {
      const ping = reminder.pings.find((p) => p.id === pingId);
      if (ping && ping.state === 'scheduled') {
        ping.state = 'fired';
        await putReminder(reminder);
      }
    }
  } catch (err) {
    console.error('failed to mark ping fired', err);
  }
}
