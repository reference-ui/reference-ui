// SPEC-V2-53: unmutated `export let` folds across files; mutated drops.
export let glow = 'amber.500'

export let shifted = 'red.500'
shifted = 'green.500'
