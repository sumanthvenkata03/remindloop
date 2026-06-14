import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import { requireEnv } from './env';

const client = new SchedulerClient({});

/** EventBridge one-time schedules use `at(yyyy-mm-ddThh:mm:ss)`. We pass UTC. */
function atExpression(d: Date): string {
  return `at(${d.toISOString().slice(0, 19)})`; // strip milliseconds + 'Z'
}

export async function createPingSchedule(opts: {
  scheduleName: string;
  fireAt: Date;
  payload: Record<string, unknown>;
}): Promise<void> {
  await client.send(
    new CreateScheduleCommand({
      Name: opts.scheduleName,
      FlexibleTimeWindow: { Mode: 'OFF' },
      ScheduleExpression: atExpression(opts.fireAt),
      ScheduleExpressionTimezone: 'UTC',
      Target: {
        Arn: requireEnv('SENDER_FUNCTION_ARN'),
        RoleArn: requireEnv('SCHEDULER_ROLE_ARN'),
        Input: JSON.stringify(opts.payload),
      },
      // delete the schedule automatically once it has fired — no cleanup needed
      ActionAfterCompletion: 'DELETE',
    }),
  );
}

export async function deleteSchedule(name: string): Promise<void> {
  try {
    await client.send(new DeleteScheduleCommand({ Name: name }));
  } catch {
    // already fired and auto-deleted, or never existed — nothing to do
  }
}
