/**
 * Strict-token type assertions.
 *
 * These do not run at runtime. They exist so `pnpm exec tsc --noEmit` (run by
 * the matrix pipeline when `runTypecheck: true`) verifies that the strict
 * wrappers `ref sync` codegen applies to `SystemStyleObject` actually narrow
 * the relevant style props.
 *
 * The companion `ui.config.ts` opts into `strict: ['colors', 'radii']`, so:
 *
 * - color-bearing props must be a token or one of the safe keywords
 * - radius props must be a token or one of the safe keywords
 * - other props (e.g. `fontSize`, `width`) stay open
 *
 * Each invalid assignment is preceded by `// @ts-expect-error`. If the strict
 * wrapper is missing, the directive becomes "unused" and tsc fails the matrix.
 */

import type { SystemStyleObject } from '@reference-ui/system'

// ─── Colors: tokens accepted ────────────────────────────────────────────────
const colorOk: SystemStyleObject = {
  color: 'gray.500',
  backgroundColor: 'gray.100',
  borderColor: 'gray.200',
}
void colorOk

// ─── Colors: safe CSS keywords accepted ─────────────────────────────────────
const colorKeywordsOk: SystemStyleObject = {
  color: 'inherit',
  backgroundColor: 'transparent',
  borderColor: 'currentColor',
  fill: 'white',
  stroke: 'black',
}
void colorKeywordsOk

// ─── Colors: arbitrary CSS rejected ─────────────────────────────────────────
const colorReject1: SystemStyleObject = {
  // @ts-expect-error — arbitrary hex must be rejected when strict: ['colors']
  color: '#ff0000',
}
void colorReject1

const colorReject2: SystemStyleObject = {
  // @ts-expect-error — rgb() functional values must be rejected when strict: ['colors']
  backgroundColor: 'rgb(255, 0, 0)',
}
void colorReject2

const colorReject3: SystemStyleObject = {
  // @ts-expect-error — non-token keyword must be rejected when strict: ['colors']
  borderColor: 'red',
}
void colorReject3

// ─── Radii: tokens accepted ─────────────────────────────────────────────────
const radiiOk: SystemStyleObject = {
  borderRadius: 'md',
  borderTopLeftRadius: 'lg',
  rounded: 'full',
  roundedTopRight: 'sm',
}
void radiiOk

// ─── Radii: safe CSS keywords accepted ──────────────────────────────────────
const radiiKeywordsOk: SystemStyleObject = {
  borderRadius: 'none',
  rounded: 'inherit',
  borderTopLeftRadius: 'initial',
  roundedBottomLeft: 'revert',
}
void radiiKeywordsOk

// ─── Radii: arbitrary length values rejected ────────────────────────────────
const radiiReject1: SystemStyleObject = {
  // @ts-expect-error — arbitrary px must be rejected when strict: ['radii']
  borderRadius: '8px',
}
void radiiReject1

const radiiReject2: SystemStyleObject = {
  // @ts-expect-error — arbitrary rem must be rejected when strict: ['radii']
  rounded: '0.5rem',
}
void radiiReject2

const radiiReject3: SystemStyleObject = {
  // @ts-expect-error — bare number must be rejected when strict: ['radii']
  borderTopLeftRadius: 12,
}
void radiiReject3

// ─── Non-strict props remain open ───────────────────────────────────────────
// These props are NOT in the strict list — arbitrary values must keep working.
const nonStrictOpen: SystemStyleObject = {
  fontSize: '13px',
  width: '420px',
  margin: '8px',
  padding: '0 12px',
  zIndex: 99,
}
void nonStrictOpen
