# TST-EXT-03 — Module augmentation that tasty cannot merge warns TST-W-UNSUPPORTED-AUGMENTATION

`augment.ts` declares `declare module './base' { interface Base { extra: number } }`. TypeScript merges
`extra` into `Base`, but tasty does not merge augmenting declarations into the augmented module. The loss
must be visible: the scan warns `TST-W-UNSUPPORTED-AUGMENTATION`, naming the augmenting file and the module
`./base`, and `Base` keeps only the member it declares itself. The warning is the only diagnostic.

Origin: doom round break TST-DOOM-14. Before the fix, the `declare module` block was dropped without any
warning.
