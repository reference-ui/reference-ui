# `src/` — the host

Neo's TypeScript: everything above the cut. Authors write fragments and
style calls; this tree evaluates them once, compiles through Rust,
publishes the generated folder, and serves the runtime that paints in the
browser.

The pipeline runs in one direction. `config/` loads and validates
`ui.config` — discovery, esbuild bundling, evaluation, validation, plus
the small in-memory store behind path resolution. `collect/` finds the
author calls (`tokens()`, `font()`, `keyframes()`, `globalCss()`, pattern
extensions), evaluates each file once in Node, and merges the results
into one `EvaluatedSystemSpec`. `sync/` drives the whole pass: prepare
fragments, hand the frozen compile request to the native engine, then
publish the generated `system`, `styled`, and `react` legs and link them
into the project. Nothing here lowers styles; the wire format lives in
`reference-rs/contracts/`, and the stylesheet comes back from Rust.

The other half faces the browser. `runtime/` (`css/`, `recipe/`) holds the
authored `css()` and `recipe()` resolvers over the natively compiled plans —
the runtime picks classes, constructs the miss class on a miss, and warns
once in dev. `primitives/` holds the native tags: the factory that splits
style props from DOM props and stamps the layer, color-mode, and variant
attributes, plus the generator that writes the `react` entry (its stable
surface also types worlds under the pre-run check). `entry/` holds the unbound
React entry and its type files. `index.ts` is the single entry behind the
`@reference-ui/neo` id that fragment files and configs import, and
`system-surface.d.ts` is the stable type surface for the generated
`@reference-ui/system` entry. `reference/` is the S6 reference API that Node
consumers such as MCP use to build documents without the browser runtime.

Around them: `cli/` is the `ref` command layer, `diagnostics/` formats and
reports errors, `native/` is the bridge to the Rust compiler, `packager/`
writes the generated packages, and `system/` holds the base system. `lib/`
carries Neo-owned seams (`paths/`, `symlink/`, `watch/`) and `microbundle/`,
which builds the esbuild bundles for configs and fragments. `constants.ts`
holds the one layout name they share.

Refusals (from the Neo README): no style lowering in TS, no second
Atomic, no second `EvaluatedSystemSpec` (wire format lives in
`reference-rs/contracts/`), no thread-pool opera — fragments, one native
compile, publish. A function.
