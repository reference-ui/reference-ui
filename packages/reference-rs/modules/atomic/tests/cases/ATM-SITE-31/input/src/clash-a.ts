// Same-named helper, origin A (SPEC-V2-57 collision probe): resolves by
// binding, so an importer of './clash-a' folds coral, never gold.
export const clash = (): string => 'coral'
