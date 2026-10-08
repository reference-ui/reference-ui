// Same-named helper, origin B (SPEC-V2-57 collision probe): an importer of
// './clash-b' folds gold. First-wins merge would paint one origin's callers
// with the other's value; the binding walk keeps them apart.
export const clash = (): string => 'gold'
