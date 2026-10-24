# ATM-BOUND-07 — a css() value chained 20,000 to 100,000 operators deep, or an else-if chain 10,000 branches long, with no brackets to count, is refused with a located ATM-E-PARSE beside its siblings by the shared chain gate or atomic's depth gate, and chains just under the limit, a 2,100-branch else-if chain among them, compile

`input/` holds two styled siblings, `src/red.ts` and `src/blue.ts`, and compiles in process. The bound is the extra
files: `spec.ts` writes them into a temp project it owns (`withTempDir`) and compiles that project once in a child
process through `driver.mjs` under `runIsolated` (kill budget 60 s, budget 15 s through `expectBounded`).

Each extra file nests one `css()` colour value in a chain with no bracket that nests, so the bracket count of the shared
nesting gate (ATM-BOUND-02) counts it at nothing and every link is one more AST level for the walkers. The shapes are a binary `+`
chain, a logical `||` chain, a static member chain, a computed member chain, an optional chain, a call chain, an `as`
chain, a non-null chain (each 100,000 links, which Oxc parses in a loop), and a ternary alternate chain, a `!` chain, a `-`
chain and a `void` chain (each 20,000 links, which Oxc parses by recursion). Before the depth gate the
walkers recursed once per link, and a long enough chain overflowed the stack and killed the process.

Two gates answer, and the shape decides which. The shared pre-scan refuses a prefix, ternary, arrow or assignment chain of more
than 8,192 links before Oxc parses it, because Oxc recurses through those chains: the `conditional`, `unary`, `negation` and
`void` files (20,000 links each) get `operator chain longer than 8192 links at line 2; split or flatten the long chain of operators`.
The depth gate (`atomic/src/depth.rs`) runs on every parsed program that got past the pre-scan and refuses one whose expressions, statements or
types nest past 8,192 levels, the largest power of two whose costliest chain compiles in half of the 16 MiB stack floor
(`atomic/src/tests/depth.rs` measures it). Every other deep file gets `code nested deeper than 8192 levels at line 2; split or flatten the long chain of operators, else-if branches or conditional types`.
Each deep file must report exactly one `ATM-E-PARSE` that names the file at line 2 with its gate's message, and must emit
no class from its value. `src/branchesdeep.ts` is one more deep file: 10,000 else-if branches on line 2, a statement chain
with a plain `css()` call beside it. `src/under.ts` chains 8,000 empty-string concatenations ahead of `'green'`, which sits
under the limit, so its colour folds and emits `color:green`. `src/branches.ts` chains 2,100 else-if branches, past the
old 2,048 limit and under the current one, beside a `css()` call, so the call emits `color:purple`. The siblings'
`color:red` and `color:blue` stay.

Siblings: ATM-BOUND-02 (the same temp-project pattern for bracket nesting past the shared gate, which counts brackets and
leaves these chains alone: its brackets are not chains).

> Search terms: expression depth, operator chain, stack overflow, fold walker recursion, depth gate, ATM-E-PARSE, binary chain, ternary chain, unary chain, member chain, bounded compile, sibling isolation
