import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CATEGORY = 'REMINDER';
export const CHANNEL = 'reminders';

// How notifications behave while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for permission, set up the high-importance Android channel, and register
 * the Done / Snooze action buttons. Call once on app start.
 */
export async function initNotifications(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }

  if (Platform.OS === 'android') {
    // MAX importance => heads-up banner that wakes the screen + shows on lock screen.
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: '#F5A623',
    });
  }

  // Buttons that ride along on the reminder notification.
  await Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: 'DONE', buttonTitle: '✓ Done', options: { opensAppToForeground: false } },
    { identifier: 'SNOOZE_1D', buttonTitle: 'Snooze 1 day', options: { opensAppToForeground: false } },
    { identifier: 'SNOOZE_1W', buttonTitle: 'Snooze 1 week', options: { opensAppToForeground: false } },
  ]);

  return granted;
}

/** Schedule one local notification. Returns the id so we can cancel it later. */
export async function schedulePing(opts: {
  title: string;
  reminderId: string;
  pingId: string;
  fireAt: Date;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${opts.title}`,
      body: 'Tap to open, or use the buttons below.',
      categoryIdentifier: CATEGORY,
      sound: 'default',
      data: { reminderId: opts.reminderId, pingId: opts.pingId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: opts.fireAt,
      channelId: CHANNEL,
    },
  });
}

export async function cancelPing(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already fired or gone — nothing to do
  }
}
