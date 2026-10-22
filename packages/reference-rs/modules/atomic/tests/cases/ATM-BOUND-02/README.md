# ATM-BOUND-02 — a file nested 300,000 levels deep, or 5,000 JSX elements deep, is refused with a located ATM-E-PARSE beside its siblings, also behind a regex literal or a TSX generic function type

`input/` holds two styled siblings, `src/red.ts` and `src/blue.ts`, and compiles in process. The bound is the extra
file, and `spec.ts` checks four shapes of it, each in its own temp project that it owns (`withTempDir`) and each
compiled in a child process through `driver.mjs` under `runIsolated` (kill budget 30 s, budget 2000 ms through
`expectBounded`):

- `src/deep.ts` nests one `css()` colour value 300,000 parentheses deep on line 2.
- `src/nest.tsx` nests 5,000 `<div>` elements on line 2, the shape of a css-bearing component whose JSX tree is
  nested. The pre-scan counts a JSX element as one level once its closing tag is seen, in `.tsx` and `.jsx` files.
- `src/quote.ts` puts the same 300,000 levels on line 2 behind the regex literal `/"/`. The quote used to open a string
  that hid the rest of the line from the pre-scan, so the nesting was never counted.
- `src/poison.tsx` puts them behind the generic function type `type Id = <T>(x: T) => T;`, which TSX first reads as an
  element. Its text used to hide the rest of the file from the pre-scan; the `>` of the arrow now ends that element.

The pre-scan refuses each file before Oxc sees it. Each compile must report exactly one `ATM-E-PARSE` that names the
file at line 2 with the message `nesting deeper than 1024 levels at line 2; split or flatten the deeply nested expression`,
must emit no class from the nested value (`color:green`), and must keep both siblings' classes.

The parenthesis depth is sized past the current build's limit. On the exports' 256 MiB thread the unguarded compile
survives 5,000 and 160,000 levels with no signal and no `ATM-E-PARSE`, and dies with SIGILL from 200,000 levels, so
at 300,000 the red run fails by signal and the green run fails nothing. The JSX depth is 5,000, which the unguarded
build compiles with no diagnostic (about 0.5 s), so that red run fails on the missing `ATM-E-PARSE`.

Siblings: ATM-BOUND-01 (a 1,000-deep value compiles in a child process), ATM-BOUND-03 (the same temp-project pattern
for an export-star clique).

> Search terms: nesting depth, pre-scan, parse refusal, located parse error, stack overflow, deep parentheses, JSX nesting, regex literal, generic function type, bounded compile, ATM-E-PARSE, sibling isolation
