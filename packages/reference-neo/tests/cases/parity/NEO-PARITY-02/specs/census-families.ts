// census-families.ts — the checked-in PARITY-02 family table for
// NEO-PARITY-02. It takes nothing and emits the 43 census rows (F1–F37 plus
// T-A–T-F per oracle C §2) with their sheet markers, must-not-appear
// strings, union cites, and blocked cites, plus the known-unproven (b)
// table the census shows with RS owners instead of silently missing.
// The (b) table is empty: all six N2 rows landed. Markers are verbatim
// sheet substrings proven against the mini-lib sheet.

export interface CensusFamily {
  id: string;
  markers: string[];
  absent: string[];
  union: string[];
  blocked: string[];
}

export const FAMILIES: CensusFamily[] = [
  {
    id: 'F1',
    markers: [
      '@layer reset, global, base, tokens, recipes, utilities;',
      '@layer reset {',
      '@layer global {',
      '@layer tokens {',
      '@layer recipes {',
      '@layer utilities {',
    ],
    absent: [],
    union: ['layer-a1'],
    blocked: [],
  },
  {
    id: 'F2',
    markers: ['box-sizing: border-box', 'prefers-reduced-motion', 'animation-duration: 0.01ms !important'],
    absent: [],
    union: [],
    blocked: [],
  },
  {
    id: 'F3',
    markers: ['@layer tokens', '--colors-brand: #7c3aed', ':root, [data-color-mode=light]'],
    absent: [],
    union: [],
    blocked: [],
  },
  { id: 'F4', markers: ['--colors-ui-panel: #f3f4f6', '--colors-ui-panel: #111827'], absent: [], union: [], blocked: [] },
  { id: 'F5', markers: ['[data-color-mode=dark]'], absent: [], union: ['prim-o3'], blocked: [] },
  {
    id: 'F6',
    markers: ['--fonts-sans:', '--font-weights-sans-bold: 700'],
    absent: [],
    union: ['sync-a2'],
    blocked: [],
  },
  {
    id: 'F7',
    markers: ['--spacing-root: 0.25rem', 'calc(4 * var(--spacing-root))'],
    absent: [],
    union: [],
    blocked: [],
  },
  {
    id: 'F8',
    markers: ['--radii-lg: 12px', 'rounded_lg', 'rounded_1r'],
    absent: [],
    union: ['token-a3', 'token-o7', 'resp-a3'],
    blocked: [],
  },
  {
    id: 'F9',
    markers: ['prefers-reduced-motion', '@media (min-height: 700px)'],
    absent: [],
    union: ['resp-a1', 'global-o6'],
    blocked: [],
  },
  { id: 'F10', markers: ['@container (min-width: 768px)'], absent: [], union: [], blocked: [] },
  {
    id: 'F11',
    markers: ['@media print', 'prefers-color-scheme: dark', 'motionReduce'],
    absent: [],
    union: ['cond-a4'],
    blocked: [],
  },
  { id: 'F12', markers: [':is(', ':hover', ':focus-visible', ':has('], absent: [], union: [], blocked: [] },
  { id: 'F13', markers: [], absent: [':nth-child', ':visited', ':indeterminate'], union: ['cond-a5'], blocked: [] },
  {
    id: 'F14',
    markers: ['::placeholder', '::file-selector-button', '::-webkit-slider-thumb', '::marker', '::before', '::after'],
    absent: [],
    union: [],
    blocked: [],
  },
  {
    id: 'F15',
    markers: ['[data-hover]', '[data-slot="icon"]', '[data-variant="primary"]', '[data-state="open"]', '[aria-invalid="true"]'],
    absent: [],
    union: [],
    blocked: [],
  },
  { id: 'F16', markers: ['[data-reference-field]', '[data-slot="control"]'], absent: [], union: [], blocked: [] },
  {
    id: 'F17',
    markers: ['[data-reference-field] > [data-slot="control"]', ':where(.group', ':where(.peer', 'ml_8px'],
    absent: [],
    union: ['css-o5', 'global-o4'],
    blocked: [],
  },
  { id: 'F18', markers: ['color: var(--colors-brand) !important'], absent: [], union: [], blocked: [] },
  { id: 'F19', markers: ['tracking_-0\\.01em', '32 xl'], absent: [], union: [], blocked: [] },
  { id: 'F20', markers: ['var(--colors-ui-button-background)'], absent: [], union: [], blocked: [] },
  { id: 'F21', markers: [], absent: [], union: ['global-a5', 'sync-a5'], blocked: [] },
  {
    id: 'F22',
    markers: [
      'color-mix(in srgb, var(--colors-brand) 40%, transparent)',
      'color-mix(in srgb, var(--colors-ink) 80%, var(--colors-paper))',
    ],
    absent: [],
    union: [],
    blocked: [],
  },
  { id: 'F23', markers: ['d_flex', 'px_sm'], absent: [], union: [], blocked: [] },
  { id: 'F24', markers: [], absent: ['.size_md', 'md{width:md}'], union: ['global-a5', 'sync-a5'], blocked: [] },
  {
    id: 'F25',
    markers: ['.ref-button', 'card__base', 'chip_c_loud_lg'],
    absent: [],
    union: ['recipe-a1', 'recipe-a2'],
    blocked: [],
  },
  { id: 'F26', markers: ['d_flex'], absent: [], union: ['css-o3', 'css-o4'], blocked: [] },
  {
    id: 'F27',
    markers: ['@keyframes fadeIn', 'fadeIn 0.2s ease-out'],
    absent: [],
    union: ['global-a3'],
    blocked: [],
  },
  { id: 'F28', markers: ['@font-face', 'size-adjust: 104%'], absent: [], union: [], blocked: [] },
  { id: 'F29', markers: ['bg-c_'], absent: ['colorPalette'], union: ['static-a3', 'token-a1', 'layer-a5', 'type-a5'], blocked: [] },
  { id: 'F30', markers: [], absent: ['colorPalette'], union: ['static-a3', 'token-a1'], blocked: [] },
  { id: 'F31', markers: ['[data-hover]', ':hover'], absent: [], union: [], blocked: [] },
  { id: 'F32', markers: ['container-type: inline-size', 'container-name: sidebar'], absent: [], union: [], blocked: [] },
  { id: 'F33', markers: [], absent: ['--made-with-panda'], union: ['global-a1', 'layer-a4', 'sync-a5'], blocked: [] },
  { id: 'F34', markers: [], absent: ['.focus_true', 'isolation_true'], union: ['parity-p1'], blocked: [] },
  { id: 'F35', markers: [], absent: ['ui.panel.background'], union: ['parity-p1'], blocked: [] },
  { id: 'F36', markers: [], absent: ['--made-with-panda'], union: ['global-a1', 'layer-a4', 'sync-a5'], blocked: [] },
  { id: 'F37', markers: [], absent: [], union: ['global-a5'], blocked: [] },
  {
    id: 'T-A',
    markers: ['.ref-link:focus-visible { outline-color: var(--colors-ui-focus-ring) }'],
    absent: [],
    union: [],
    blocked: [],
  },
  {
    id: 'T-B',
    markers: ['--spacing-root: 0.25rem', 'container-type: inline-size'],
    absent: [],
    union: ['global-a4'],
    blocked: [],
  },
  {
    id: 'T-C',
    markers: [
      ':is(:hover, [data-hover])',
      ':has([data-slot="icon"])',
      'color-mix(in srgb, var(--colors-ink)',
      ':where([data-variant="primary"])',
    ],
    absent: [],
    union: [],
    blocked: [],
  },
  { id: 'T-D', markers: ['::before', '::after', '201C', '201D'], absent: [], union: [], blocked: [] },
  {
    id: 'T-E',
    markers: ['::placeholder', 'calc(3.5 * var(--spacing-root))'],
    absent: [],
    union: [],
    blocked: [],
  },
  { id: 'T-F', markers: ['font-family_sans', '--font-weights-sans-bold: 700'], absent: [], union: [], blocked: [] },
];

export interface BlockedRow {
  row: string;
  group: string;
  rs: string;
}

export const BLOCKED: BlockedRow[] = [];
