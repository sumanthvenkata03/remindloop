/**
 * Visual identity: warm near-black ("late evening") with a single amber accent
 * that reads as an alarm bell / lamp glow. Deliberately not the usual blue-utility
 * or cream-serif look. One accent, lots of calm space, big tap targets for the Fold.
 */

export const colors = {
  bg: '#14110F',
  surface: '#211C19',
  surfaceAlt: '#2B2420',
  border: '#3A302A',
  text: '#F3EEE9',
  dim: '#A89B90',
  faint: '#6E625A',
  accent: '#F5A623',
  accentInk: '#1A1206',
  good: '#3FB97F',
  danger: '#E5604D',
};

export const radius = { sm: 10, md: 14, lg: 22, pill: 999 };

export const space = (n: number) => n * 4;

export const type = {
  display: 30,
  title: 21,
  body: 16,
  label: 14,
  small: 12.5,
};
