import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  buildPresetOptions,
  customDate,
  formatFireAt,
  normalizeTimes,
  PresetKey,
  TimeOfDay,
  TOD_LABEL,
} from '../lib/timing';
import { CheckRow, Chip, SectionTitle, Stepper } from './ui';
import { colors, radius, space, type } from '../theme';

type Selected = Record<PresetKey, boolean>;
const EMPTY: Selected = { in3h: false, tonight: false, tomorrow: false, in2d: false, in1w: false };

/**
 * Lets the user tick any number of preset times, optionally add one custom day,
 * and pick a time-of-day. Reports the final, de-duplicated, sorted Date[] upward.
 */
export function TimingPicker({ onChange }: { onChange: (times: Date[]) => void }) {
  const [tod, setTod] = useState<TimeOfDay>('evening');
  const [selected, setSelected] = useState<Selected>(EMPTY);
  const [customOn, setCustomOn] = useState(false);
  const [dayOffset, setDayOffset] = useState(1);

  const options = useMemo(() => buildPresetOptions(tod), [tod]);

  const times = useMemo(() => {
    const dates: Date[] = [];
    for (const o of options) if (selected[o.key] && o.preview) dates.push(o.preview);
    if (customOn) dates.push(customDate(dayOffset, tod));
    return normalizeTimes(dates);
  }, [options, selected, customOn, dayOffset, tod]);

  useEffect(() => {
    onChange(times);
    // onChange is memoized by the parent; we only want to fire when `times` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [times]);

  const customLabel = (v: number) =>
    v === 0 ? 'Today' : v === 1 ? 'Tomorrow' : formatFireAt(customDate(v, tod)).split(' · ')[0];

  return (
    <View>
      <SectionTitle>Time of day</SectionTitle>
      <View style={styles.chipRow}>
        {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((t) => (
          <Chip key={t} label={TOD_LABEL[t]} active={tod === t} onPress={() => setTod(t)} />
        ))}
      </View>

      <SectionTitle>Remind me — pick any</SectionTitle>
      {options.map((o) => (
        <CheckRow
          key={o.key}
          label={o.label}
          sub={o.preview ? formatFireAt(o.preview) : 'unavailable now'}
          checked={selected[o.key]}
          disabled={!o.available}
          onToggle={() => setSelected((s) => ({ ...s, [o.key]: !s[o.key] }))}
        />
      ))}

      <SectionTitle>Custom date (optional)</SectionTitle>
      <CheckRow
        label="Add a custom day"
        sub={customOn ? formatFireAt(customDate(dayOffset, tod)) : 'off'}
        checked={customOn}
        onToggle={() => setCustomOn((v) => !v)}
      />
      {customOn ? (
        <View style={{ marginTop: space(1) }}>
          <Stepper value={dayOffset} onChange={setDayOffset} format={customLabel} />
        </View>
      ) : null}

      <View style={styles.preview}>
        {times.length === 0 ? (
          <Text style={styles.previewEmpty}>No times picked yet — tick one or more above.</Text>
        ) : (
          <>
            <Text style={styles.previewHead}>
              {times.length} reminder{times.length === 1 ? '' : 's'} will be set:
            </Text>
            {times.map((t, i) => (
              <Text key={i} style={styles.previewLine}>
                •  {formatFireAt(t)}
              </Text>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  preview: {
    marginTop: space(4),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(3.5),
  },
  previewEmpty: { color: colors.dim, fontSize: type.small },
  previewHead: { color: colors.accent, fontSize: type.small, fontWeight: '800', marginBottom: space(1.5) },
  previewLine: { color: colors.text, fontSize: type.label, lineHeight: 22 },
});
