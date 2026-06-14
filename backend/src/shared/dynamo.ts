import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Reminder } from './schema';
import { requireEnv } from './env';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const table = () => requireEnv('TABLE_NAME');

// The table's sort key attribute is `reminderId`; our Reminder type uses `id`.
// Zod's default object parsing drops the extra `reminderId` key on read.
function toItem(r: Reminder): Record<string, unknown> {
  return { ...r, reminderId: r.id };
}

export async function putReminder(r: Reminder): Promise<void> {
  await doc.send(new PutCommand({ TableName: table(), Item: toItem(r) }));
}

export async function getReminder(owner: string, id: string): Promise<Reminder | null> {
  const res = await doc.send(
    new GetCommand({ TableName: table(), Key: { owner, reminderId: id } }),
  );
  if (!res.Item) return null;
  const parsed = Reminder.safeParse(res.Item);
  return parsed.success ? parsed.data : null;
}

export async function listReminders(owner: string): Promise<Reminder[]> {
  const res = await doc.send(
    new QueryCommand({
      TableName: table(),
      KeyConditionExpression: '#o = :o',
      ExpressionAttributeNames: { '#o': 'owner' },
      ExpressionAttributeValues: { ':o': owner },
    }),
  );
  return (res.Items ?? [])
    .map((it) => Reminder.safeParse(it))
    .filter((p): p is { success: true; data: Reminder } => p.success)
    .map((p) => p.data);
}
