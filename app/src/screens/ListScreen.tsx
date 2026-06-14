import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Reminder } from '../lib/schema';
import { formatFireAt, formatRelative } from '../lib/timing';
import { PrimaryButton } from '../components/ui';
import { colors, radius, space, type } from '../theme';

function nextFire(r: Reminder): number {
  const upcoming = r.pings
    .filter((p) => p.state === 'scheduled')
    .map((p) => new Date(p.fireAt).getTime())
    .filter((t) => t > Date.now());
  return upcoming.length ? Math.min(...upcoming) : Infinity;
}

function activePingCount(r: Reminder): number {
  return r.pings.filter((p) => p.state === 'scheduled' && new Date(p.fireAt).getTime() > Date.now()).length;
}

export function ListScreen({
  reminders,
  onAdd,
  onOpen,
}: {
  reminders: Reminder[];
  onAdd: () => void;
  onOpen: (id: string) => void;
}) {
  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return nextFire(a) - nextFire(b);
    });
  }, [reminders]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.brand}>RemindLoop</Text>
        <Text style={styles.tagline}>Dump it. I'll nudge you.</Text>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyMark}>🔔</Text>
          <Text style={styles.emptyTitle}>Nothing scheduled</Text>
          <Text style={styles.emptyBody}>
            Tap the button below, type or speak what's on your mind, and choose when to be reminded.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: space(4), paddingBottom: space(28), gap: space(2.5) }}
          renderItem={({ item }) => {
            const count = activePingCount(item);
            const next = nextFire(item);
            const done = item.status === 'done' || count === 0;
            return (
              <Pressable
                onPress={() => onOpen(item.id)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.dot, { backgroundColor: done ? colors.faint : colors.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, done && styles.rowTitleDone]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {done
                      ? 'Done'
                      : `${formatFireAt(new Date(next))} · ${formatRelative(new Date(next))}`}
                  </Text>
                </View>
                {!done && count > 1 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.fabWrap}>
        <PrimaryButton label="+  New reminder" onPress={onAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(2) },
  brand: { color: colors.text, fontSize: type.display, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: colors.dim, fontSize: type.label, marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(10) },
  emptyMark: { fontSize: 46, marginBottom: space(3) },
  emptyTitle: { color: colors.text, fontSize: type.title, fontWeight: '700', marginBottom: space(2) },
  emptyBody: { color: colors.dim, fontSize: type.body, textAlign: 'center', lineHeight: 23 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { color: colors.text, fontSize: type.body, fontWeight: '700' },
  rowTitleDone: { color: colors.dim, textDecorationLine: 'line-through' },
  rowMeta: { color: colors.dim, fontSize: type.small, marginTop: 3 },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.accent, fontSize: type.small, fontWeight: '800' },

  fabWrap: {
    position: 'absolute',
    left: space(4),
    right: space(4),
    bottom: space(6),
  },
});
