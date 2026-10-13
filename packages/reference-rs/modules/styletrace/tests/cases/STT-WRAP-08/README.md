# STT-WRAP-08 — A wrapper exported through a const alias or memo traces under the exported name

A wrapper function that is not exported keeps its local name, while the export that names it is the public surface. `export const Card = CardBase` is an identifier-valued export, and `React.memo(CardBase)`, `memo(CardBase)`, `React.forwardRef(CardBase)`, `forwardRef(CardBase)` and the nested `memo(forwardRef(CardBase))` all wrap the same local binding.
Each of those export names traces under its own export name (Card, MemoCard, ImportMemoCard, RefCard, ImportRefCard, NestedCard), and the unexported CardBase emits nothing.
A style-less wrapper exported through `React.memo` (PlainMemo) mints no name.
