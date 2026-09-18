# NEO-TYPE-01 — generated react declarations compile a consumer world

After `sync()`, the generated `react.d.mts` types a consumer world using
primitives, `css()`/`recipe()`, and named types: the world `tsconfig.json`
`paths` point at the generated `.d.mts` files and `tsc --noEmit` exits 0.
The world declares brand/ink/paper colors plus spacing and radii, renders
primitives with token props, and resolves one `css()` panel and one
tone/size recipe. The spec pins the committed `paths` mapping, typechecks an
end-state consumer (everything imported from `@reference-ui/react`) in a temp
dir against the generated declarations, and asserts the token-driven probes
paint in the browser.

The consumer is materialized at spec time because it cannot live in the repo:
the harness pre-run typecheck resolves `@reference-ui/react` to the stable
surface, which exports no `css`/`recipe` until the generated named graph lands
in lockstep. R1 verified the engine (`emitDtsSync` over this world's token and
recipe shape) prints the unions, `StyleProps`, `SystemStyleObject`, recipe
variant props, and `FontRegistry` with no forbidden surface; the host leg
(`publish.ts` writing `styled/types`, react types referencing them) landed with
the publish tail, as did the `react.d.mts` filename (D5) and the world
import-graph flip to all-from-react.

Evidence: `[core]` `.reference-ui/types`; generated-folder-shape §4;
`[decision D5]`; typegen goldens `tokens.d.ts`, `styles.d.ts`, `recipes.d.ts`.
