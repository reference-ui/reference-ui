// SPEC-V2-53: unmutated `export let` folds across files; mutated drops.
export let glow = 'amber.500'

export let shifted = 'red.500'
shifted = 'green.500'

// SPEC-V2-34 cross-file (R3b): a spread inside an exported object resolves
// through the binding walk — the importer folds color and padding alike,
// exactly like the same-file `cardButton` in objects.ts.
const spreadBase = { color: 'plum' }
export const spreadButton = { ...spreadBase, padding: '9px' }
