# TST-EXT-03 — Module augmentation that tasty cannot merge warns TST-W-UNSUPPORTED-AUGMENTATION

`augment` declares `declare module './base' { interface Base { extra: number } }`. TypeScript merges
`extra` into `Base`, but tasty does not merge augmenting declarations into the augmented module. The loss
must be visible: the scan warns `TST-W-UNSUPPORTED-AUGMENTATION`, naming the augmenting file and the module
`./base`, and `Base` keeps only the member it declares itself. The warning is the only diagnostic.

Guards against the `declare module` block being dropped without any warning.
