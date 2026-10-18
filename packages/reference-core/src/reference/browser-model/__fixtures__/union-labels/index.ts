// Union-label fixture entry: it re-exports the button props surface the way a
// real consumer barrel would. Tasty scans every fixture file, so symbols only
// declared in `types.ts` still land in the built manifest.
// (Vendored from the TST-DOC-01-jsdoc case input; compiled at test time.)

export type { ButtonProps, CreateButton } from './types.ts'
