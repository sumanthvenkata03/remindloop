import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Reminder } from '../lib/schema';
import { formatFireAt, formatRelative } from '../lib/timing';
import { TimingPicker } from '../components/TimingPicker';
import { Card, GhostButton, PrimaryButton, SectionTitle } from '../components/ui';
import { colors, radius, space, type } from '../theme';

export function DetailScreen({
  reminder,
  onBack,
  onDelete,
  onMarkDone,
  onAddTimes,
}: {
  reminder: Reminder;
  onBack: () => void;
  onDelete: (id: string) => void;
  onMarkDone: (id: string) => void;
  onAddTimes: (id: string, times: Date[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTimes, setNewTimes] = useState<Date[]>([]);
  const handleTimes = useCallback((t: Date[]) => setNewTimes(t), []);

  const upcoming = reminder.pings
    .filter((p) => p.state === 'scheduled' && new Date(p.fireAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime());

  const past = reminder.pings
    .filter((p) => p.state !== 'scheduled' || new Date(p.fireAt).getTime() <= Date.now())
    .sort((a, b) => new Date(b.fireAt).getTime() - new Date(a.fireAt).getTime());

  const confirmDelete = () => {
    Alert.alert('Delete reminder?', `"${reminder.title}" and all its pings will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(reminder.id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}>
      <GhostButton label="‹  Back" onPress={onBack} />
      <Text style={styles.title}>{reminder.title}</Text>
      <Text style={styles.sub}>
        Added {formatFireAt(new Date(reminder.createdAt))} · {reminder.status}
      </Text>

      <SectionTitle>Upcoming</SectionTitle>
      {upcoming.length === 0 ? (
        <Card>
          <Text style={styles.none}>No upcoming pings.</Text>
        </Card>
      ) : (
        upcoming.map((p) => (
          <Card key={p.id} style={{ marginBottom: space(2) }}>
            <Text style={styles.pingTime}>{formatFireAt(new Date(p.fireAt))}</Text>
            <Text style={styles.pingRel}>{formatRelative(new Date(p.fireAt))}</Text>
          </Card>
        ))
      )}

      {past.length > 0 ? (
        <>
          <SectionTitle>History</SectionTitle>
          {past.map((p) => (
            <View key={p.id} style={styles.histRow}>
              <Text style={styles.histTime}>{formatFireAt(new Date(p.fireAt))}</Text>
              <Text style={styles.histState}>{p.state}</Text>
            </View>
          ))}
        </>
      ) : null}

      {adding ? (
        <View style={{ marginTop: space(4) }}>
          <SectionTitle>Add more times</SectionTitle>
          <TimingPicker onChange={handleTimes} />
          <View style={{ marginTop: space(4), gap: space(1) }}>
            <PrimaryButton
              label={`Add ${newTimes.length} time${newTimes.length === 1 ? '' : 's'}`}
              disabled={newTimes.length === 0}
              onPress={() => {
                onAddTimes(reminder.id, newTimes);
                setAdding(false);
                setNewTimes([]);
              }}
            />
            <GhostButton label="Cancel" onPress={() => setAdding(false)} />
          </View>
        </View>
      ) : (
        <View style={{ marginTop: space(6), gap: space(1) }}>
          <PrimaryButton label="Add another time" onPress={() => setAdding(true)} />
          {reminder.status !== 'done' ? (
            <GhostButton label="Mark done (stops remaining pings)" onPress={() => onMarkDone(reminder.id)} />
          ) : null}
          <GhostButton label="Delete reminder" tone="danger" onPress={confirmDelete} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: type.title, fontWeight: '800', marginTop: space(2) },
  sub: { color: colors.dim, fontSize: type.small, marginTop: 3 },
  none: { color: colors.dim, fontSize: type.label },
  pingTime: { color: colors.text, fontSize: type.body, fontWeight: '700' },
  pingRel: { color: colors.accent, fontSize: type.small, marginTop: 3, fontWeight: '600' },
  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  histTime: { color: colors.dim, fontSize: type.label },
  histState: { color: colors.faint, fontSize: type.small, fontWeight: '700', textTransform: 'uppercase' },
});
