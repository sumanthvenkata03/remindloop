import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, Reminders } from './schema';

const KEY = 'reminders:v1';

export async function loadReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = Reminders.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function saveReminders(list: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function upsertReminder(r: Reminder): Promise<Reminder[]> {
  const list = await loadReminders();
  const idx = list.findIndex((x) => x.id === r.id);
  if (idx >= 0) list[idx] = r;
  else list.unshift(r);
  await saveReminders(list);
  return list;
}

export async function removeReminder(id: string): Promise<Reminder[]> {
  const list = (await loadReminders()).filter((x) => x.id !== id);
  await saveReminders(list);
  return list;
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
