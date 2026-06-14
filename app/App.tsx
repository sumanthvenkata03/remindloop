import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import { Reminder, Ping } from './src/lib/schema';
import { loadReminders, upsertReminder, removeReminder, genId } from './src/lib/storage';
import { initNotifications, schedulePing, cancelPing } from './src/lib/notifications';
import { ListScreen } from './src/screens/ListScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { colors } from './src/theme';

type Route = { name: 'list' } | { name: 'capture' } | { name: 'detail'; id: string };

export default function App() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [route, setRoute] = useState<Route>({ name: 'list' });

  const refresh = useCallback(async () => {
    setReminders(await loadReminders());
  }, []);

  // Apply a Done/Snooze action (or a plain tap) coming from a notification.
  const handleResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as {
        reminderId?: string;
        pingId?: string;
      };
      if (!data?.reminderId || !data?.pingId) return;

      const list = await loadReminders();
      const r = list.find((x) => x.id === data.reminderId);
      if (!r) return;
      const ping = r.pings.find((p) => p.id === data.pingId);
      if (!ping) return;

      const action = response.actionIdentifier;
      if (action === 'SNOOZE_1D' || action === 'SNOOZE_1W') {
        const days = action === 'SNOOZE_1D' ? 1 : 7;
        const fireAt = new Date(Date.now() + days * 86_400_000);
        const newId = await schedulePing({
          title: r.title,
          reminderId: r.id,
          pingId: ping.id,
          fireAt,
        });
        ping.fireAt = fireAt.toISOString();
        ping.notificationId = newId;
        ping.state = 'scheduled';
      } else {
        // DONE button or tapping the notification body
        ping.state = 'done';
        if (!r.pings.some((p) => p.state === 'scheduled')) r.status = 'done';
      }

      await upsertReminder(r);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    let sub: Notifications.Subscription | undefined;
    (async () => {
      await initNotifications();
      await refresh();
      // If the app was closed when the user tapped an action, handle it on launch.
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) await handleResponse(last);
      sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();
    return () => sub?.remove();
  }, [handleResponse, refresh]);

  async function createReminder(title: string, times: Date[]) {
    const id = genId();
    const pings: Ping[] = [];
    for (const t of times) {
      const pingId = genId();
      let notificationId: string | undefined;
      try {
        notificationId = await schedulePing({ title, reminderId: id, pingId, fireAt: t });
      } catch {
        // scheduling failed for this one time; keep the record without an id
      }
      pings.push({ id: pingId, fireAt: t.toISOString(), notificationId, state: 'scheduled' });
    }
    const reminder: Reminder = {
      id,
      title,
      createdAt: new Date().toISOString(),
      status: 'active',
      channels: ['app'],
      pings,
    };
    await upsertReminder(reminder);
    await refresh();
    setRoute({ name: 'list' });
  }

  async function addTimes(id: string, times: Date[]) {
    const list = await loadReminders();
    const r = list.find((x) => x.id === id);
    if (!r) return;
    for (const t of times) {
      const pingId = genId();
      let notificationId: string | undefined;
      try {
        notificationId = await schedulePing({ title: r.title, reminderId: id, pingId, fireAt: t });
      } catch {
        // ignore
      }
      r.pings.push({ id: pingId, fireAt: t.toISOString(), notificationId, state: 'scheduled' });
    }
    r.status = 'active';
    await upsertReminder(r);
    await refresh();
  }

  async function deleteReminder(id: string) {
    const list = await loadReminders();
    const r = list.find((x) => x.id === id);
    if (r) for (const p of r.pings) await cancelPing(p.notificationId);
    await removeReminder(id);
    await refresh();
    setRoute({ name: 'list' });
  }

  async function markDone(id: string) {
    const list = await loadReminders();
    const r = list.find((x) => x.id === id);
    if (!r) return;
    for (const p of r.pings) {
      if (p.state === 'scheduled') {
        await cancelPing(p.notificationId);
        p.state = 'done';
      }
    }
    r.status = 'done';
    await upsertReminder(r);
    await refresh();
  }

  const current = route.name === 'detail' ? reminders.find((r) => r.id === route.id) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.container}>
        {route.name === 'list' && (
          <ListScreen
            reminders={reminders}
            onAdd={() => setRoute({ name: 'capture' })}
            onOpen={(id) => setRoute({ name: 'detail', id })}
          />
        )}
        {route.name === 'capture' && (
          <CaptureScreen onCancel={() => setRoute({ name: 'list' })} onSave={createReminder} />
        )}
        {route.name === 'detail' &&
          (current ? (
            <DetailScreen
              reminder={current}
              onBack={() => setRoute({ name: 'list' })}
              onDelete={deleteReminder}
              onMarkDone={markDone}
              onAddTimes={addTimes}
            />
          ) : (
            <ListScreen
              reminders={reminders}
              onAdd={() => setRoute({ name: 'capture' })}
              onOpen={(id) => setRoute({ name: 'detail', id })}
            />
          ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
});
