/**
 * Pure date math for the timing picker. No React, no native deps — easy to test.
 * Everything takes an optional `now` so behaviour is deterministic in tests.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export const TOD_HOUR: Record<TimeOfDay, number> = {
  morning: 9,
  afternoon: 13,
  evening: 18,
};
export const TOD_LABEL: Record<TimeOfDay, string> = {
  morning: 'Morning · 9:00',
  afternoon: 'Afternoon · 1:00',
  evening: 'Evening · 6:00',
};

export type PresetKey = 'in3h' | 'tonight' | 'tomorrow' | 'in2d' | 'in1w';

export interface PresetOption {
  key: PresetKey;
  label: string;
  available: boolean; // false e.g. "this evening" once it's already past 6pm
  preview: Date | null;
}

function atHour(base: Date, hour: number): Date {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function presetDate(key: PresetKey, tod: TimeOfDay, now: Date = new Date()): Date | null {
  const hour = TOD_HOUR[tod];
  switch (key) {
    case 'in3h':
      return new Date(now.getTime() + 3 * 3600_000);
    case 'tonight': {
      const t = atHour(now, 18);
      return t.getTime() > now.getTime() ? t : null; // only offer if 6pm hasn't passed
    }
    case 'tomorrow':
      return atHour(addDays(now, 1), hour);
    case 'in2d':
      return atHour(addDays(now, 2), hour);
    case 'in1w':
      return atHour(addDays(now, 7), hour);
  }
}

const PRESET_LABELS: { key: PresetKey; label: string }[] = [
  { key: 'in3h', label: 'In 3 hours' },
  { key: 'tonight', label: 'This evening' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'in2d', label: 'In 2 days' },
  { key: 'in1w', label: 'In 1 week' },
];

export function buildPresetOptions(tod: TimeOfDay, now: Date = new Date()): PresetOption[] {
  return PRESET_LABELS.map(({ key, label }) => {
    const preview = presetDate(key, tod, now);
    return { key, label, available: preview !== null, preview };
  });
}

export function customDate(dayOffset: number, tod: TimeOfDay, now: Date = new Date()): Date {
  return atHour(addDays(now, dayOffset), TOD_HOUR[tod]);
}

/** De-duplicate identical timestamps, drop anything in the past, sort ascending. */
export function normalizeTimes(dates: Date[], now: Date = new Date()): Date[] {
  const seen = new Set<number>();
  const out: Date[] = [];
  for (const d of dates) {
    const t = d.getTime();
    if (t <= now.getTime()) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(d);
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

export function formatFireAt(d: Date): string {
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

export function formatRelative(d: Date, now: Date = new Date()): string {
  const ms = d.getTime() - now.getTime();
  if (ms <= 0) return 'now';
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hr`;
  const days = Math.round(hours / 24);
  if (days < 14) return `in ${days} day${days === 1 ? '' : 's'}`;
  const weeks = Math.round(days / 7);
  return `in ${weeks} week${weeks === 1 ? '' : 's'}`;
}
