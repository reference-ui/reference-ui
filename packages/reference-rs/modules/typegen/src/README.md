# Typegen native sources

Rust declaration printer. `lib.rs` turns a lowered base system plus canon into the `.d.ts` document: token unions, recipe variants, the font registry, `FontProps`, `StyleProps`, and the recursive `SystemStyleObject`. Core categories print `never` when empty while unknown categories and recipes are omitted; compound rows naming unknown axes are skipped. The `emit` and `diagnostics` modules hold the section printers and the failure vocabulary.
