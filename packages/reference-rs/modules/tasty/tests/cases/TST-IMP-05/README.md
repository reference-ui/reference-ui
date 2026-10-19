# TST-IMP-05 — A relative import whose basename has dots resolves to its TypeScript file with no unresolved-import warning

Verifies that extensionless `./theme.fragments` and `./a.styles` resolve to the `.ts` and `.tsx` sources. The dot in the
basename is not read as a file extension, so the TypeScript candidates (`.ts`, `.tsx`, `.d.ts`) are appended to the
full specifier.
Verifies that no `TST-W-UNRESOLVED-IMPORT` warning is emitted and that each imported name is a user-owned symbol
rather than an external reference.
Proves primary SPEC ID anchor TST-IMP-05.
