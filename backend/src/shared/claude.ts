import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { requireEnv, optionalEnv } from './env';

const ParseResult = z.object({
  title: z.string().min(1),
  has_timing: z.boolean(),
  fire_times: z.array(z.string()),
});
export type ParseResult = z.infer<typeof ParseResult>;

const TOOL = {
  name: 'create_reminder',
  description:
    'Extract a concise reminder title and the absolute times the user should be reminded.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'Short, clear title of what to be reminded about.',
      },
      has_timing: {
        type: 'boolean',
        description: 'True if the user mentioned any timing at all.',
      },
      fire_times: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Absolute reminder times as ISO 8601 timestamps with timezone offset. Empty array if no timing was given.',
      },
    },
    required: ['title', 'has_timing', 'fire_times'],
  },
};

/**
 * Parse a free-text message into a structured reminder. Forces a tool call so the
 * model always returns clean JSON, then validates it with Zod. Returns null if the
 * model didn't produce a usable result.
 */
export async function parseReminder(text: string): Promise<ParseResult | null> {
  const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  const tz = optionalEnv('TZ_NAME', 'America/New_York');
  const now = new Date().toISOString();

  const system =
    `You convert a person's casual message into a reminder. ` +
    `The current time is ${now} (UTC) and the user's timezone is ${tz}. ` +
    `When the user gives relative timing like "in 3 hours", "tomorrow at 9", or "next week", ` +
    `compute the matching absolute ISO 8601 timestamps. ` +
    `Always call the create_reminder tool. If no timing is mentioned, set has_timing to false ` +
    `and return an empty fire_times array.`;

  const msg = await client.messages.create({
    model: optionalEnv('CLAUDE_MODEL', 'claude-haiku-4-5-20251001'),
    max_tokens: 1024,
    system,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'create_reminder' },
    messages: [{ role: 'user', content: text }],
  });

  const block = msg.content.find((b) => b.type === 'tool_use');
  if (!block || block.type !== 'tool_use') return null;

  const parsed = ParseResult.safeParse(block.input);
  return parsed.success ? parsed.data : null;
}
