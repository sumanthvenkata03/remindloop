import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TimingPicker } from '../components/TimingPicker';
import { GhostButton, PrimaryButton, SectionTitle } from '../components/ui';
import { colors, radius, space, type } from '../theme';

export function CaptureScreen({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (title: string, times: Date[]) => void;
}) {
  const [title, setTitle] = useState('');
  const [times, setTimes] = useState<Date[]>([]);

  // memoized so TimingPicker's effect doesn't refire every render
  const handleTimes = useCallback((t: Date[]) => setTimes(t), []);

  const canSave = title.trim().length > 0 && times.length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>New reminder</Text>

        <SectionTitle>What should I remind you about?</SectionTitle>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Groceries — milk, eggs, curry leaves"
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
          autoFocus
        />
        <Text style={styles.hint}>Tip: tap the 🎤 mic on your keyboard to speak it instead of typing.</Text>

        <TimingPicker onChange={handleTimes} />

        <View style={styles.channelNote}>
          <Text style={styles.channelText}>
            Reminders arrive in this app for now. WhatsApp delivery turns on in the next update.
          </Text>
        </View>

        <View style={{ marginTop: space(5), gap: space(1) }}>
          <PrimaryButton
            label={canSave ? `Schedule ${times.length} reminder${times.length === 1 ? '' : 's'}` : 'Schedule'}
            onPress={() => onSave(title.trim(), times)}
            disabled={!canSave}
          />
          <GhostButton label="Cancel" onPress={onCancel} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: type.title, fontWeight: '800', marginBottom: space(2) },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: type.body,
    padding: space(4),
    minHeight: 76,
    textAlignVertical: 'top',
  },
  hint: { color: colors.faint, fontSize: type.small, marginTop: space(2) },
  channelNote: {
    marginTop: space(5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space(3.5),
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  channelText: { color: colors.dim, fontSize: type.small, lineHeight: 19 },
});
