# ATM-BOUND-07 — a css() value chained 20,000 to 100,000 operators deep, with no brackets to count, is refused with a located ATM-E-PARSE beside its siblings, and a chain just under the limit compiles

`input/` holds two styled siblings, `src/red.ts` and `src/blue.ts`, and compiles in process. The bound is the extra
files: `spec.ts` writes them into a temp project it owns (`withTempDir`) and compiles that project once in a child
process through `driver.mjs` under `runIsolated` (kill budget 60 s, budget 15 s through `expectBounded`).

Each extra file nests one `css()` colour value in a chain with no bracket that nests, so the shared nesting gate of
ATM-BOUND-02 counts it at nothing and every link is one more AST level for the walkers. The shapes are a binary `+`
chain, a logical `||` chain, a static member chain, a computed member chain, an optional chain, a call chain, an `as`
chain, a non-null chain (each 100,000 links, which Oxc parses in a loop), and a ternary alternate chain, a `!` chain, a `-`
chain and a `void` chain (each 20,000 links, which Oxc parses by recursion and so stays inside any stack). Before the depth gate the
walkers recursed once per link, and a long enough chain overflowed the stack and killed the process.

The depth gate (`atomic/src/depth.rs`) runs on every parsed program and refuses one whose expressions, statements or
types nest past 2,048 levels. Each deep file must report exactly one `ATM-E-PARSE` that names the file at line 2 with the
message `expression nested deeper than 2048 levels at line 2; split or flatten the long chain of operators`, and must emit
no class from its value. `src/under.ts` chains 1,900 empty-string concatenations ahead of `'green'`, which sits under the
limit, so its colour folds and emits `color:green`. The siblings' `color:red` and `color:blue` stay.

Siblings: ATM-BOUND-02 (the same temp-project pattern for bracket nesting past the shared gate, which counts brackets and
leaves these chains alone).

> Search terms: expression depth, operator chain, stack overflow, fold walker recursion, depth gate, ATM-E-PARSE, binary chain, ternary chain, unary chain, member chain, bounded compile, sibling isolation
