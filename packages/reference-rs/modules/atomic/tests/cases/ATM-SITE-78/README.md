# ATM-SITE-78

A nested import spread folds across three files (`base.ts` → `tokens.ts` → `app.ts`), named imports resolve through an `export *` barrel, a cyclic value chase keeps its literal siblings with one located `ATM-W-UNFOLDABLE-SPREAD` naming the origin spread and the cycle, and an inner origin refused mid-chase (`zest`, read while its file is mid-refinement) still folds on later direct use because cycle refusals never memoize.
Symbols: `ValueGraph`, `value_of`, `BindingOrigin`, `UnfoldableSpread`, `resolve_binding`.
Siblings: `ATM-SITE-77` (re-export cycle guards), `ATM-SITE-79` (ambiguous star refuses), `ATM-SITE-39` (imported spreads).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: nested import spread, three-file fold, export star barrel, value cycle, residue marker, unfoldable spread, demand-driven values
