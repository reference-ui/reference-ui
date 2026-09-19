// Shared button for the NEO-SITE-29 world. It takes the base object
// from the sibling base module and emits the button that folds it in
// beside its own padding leaf. The explicit .js extension is the
// browser's address for the built file; the extractor resolves the
// same binding from the scanned sources.
import { base } from './base.js'

export const button = { ...base, padding: '4px' }
