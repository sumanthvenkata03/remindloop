import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, space, type } from '../theme';

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        disabled && styles.primaryDisabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.primaryText, disabled && { color: colors.faint }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'default',
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.55 }]}>
      <Text style={[styles.ghostText, tone === 'danger' && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function CheckRow({
  label,
  sub,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={({ pressed }) => [
        styles.checkRow,
        checked && styles.checkRowOn,
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Text style={styles.boxTick}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.checkLabel}>{label}</Text>
        {sub ? <Text style={styles.checkSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipOn, pressed && { opacity: 0.85 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - 1))}
        style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{format(value)}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space(4),
    alignItems: 'center',
  },
  primaryDisabled: { backgroundColor: colors.surfaceAlt },
  primaryText: { color: colors.accentInk, fontSize: type.body, fontWeight: '700' },

  ghost: { paddingVertical: space(3), alignItems: 'center' },
  ghostText: { color: colors.dim, fontSize: type.label, fontWeight: '600' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
  },

  section: {
    color: colors.accent,
    fontSize: type.small,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space(2),
    marginTop: space(4),
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: space(3.5),
    paddingHorizontal: space(3.5),
    marginBottom: space(2),
  },
  checkRowOn: { borderColor: colors.accent },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  boxTick: { color: colors.accentInk, fontSize: 15, fontWeight: '900', lineHeight: 18 },
  checkLabel: { color: colors.text, fontSize: type.body, fontWeight: '600' },
  checkSub: { color: colors.dim, fontSize: type.small, marginTop: 2 },

  chip: {
    paddingVertical: space(2.5),
    paddingHorizontal: space(3.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.dim, fontSize: type.small, fontWeight: '700' },
  chipTextOn: { color: colors.accentInk },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space(2),
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: colors.accent, fontSize: 26, fontWeight: '700', lineHeight: 28 },
  stepValue: { color: colors.text, fontSize: type.body, fontWeight: '700' },
});
