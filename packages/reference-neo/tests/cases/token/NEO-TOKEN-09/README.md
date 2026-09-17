# NEO-TOKEN-09 — _private.secret paints inside the owning system and stays in owner types

The world declares `colors._private.secret` and paints two probes with it:
`color: '_private.secret'` and `backgroundColor: '{colors._private.secret}'`.
The spec checks the sheet declares `--colors-_private-secret` and both
utilities consume it by `var()`, each probe computes like its inline
magenta reference, and the owner type bundle still declares the
`'_private.secret'` token.

Evidence: `[core]` `system/api/tokens.ts` header contract; typegen golden
`'_private.secret'` (`modules/typegen/tests/seam.test.ts` TYP-NATIVE-01).
