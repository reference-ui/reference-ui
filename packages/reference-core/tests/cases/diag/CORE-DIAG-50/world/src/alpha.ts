// Alpha half of the CORE-DIAG-50 duplicate-symbol workspace. It takes no
// inputs and emits an exported Shared interface carrying the alpha string
// field. beta.ts exports the same name, so building the tasty workspace must
// surface TST-W-DUPLICATE-SYMBOL-NAME as a warning.
export interface Shared {
  alpha: string
}
