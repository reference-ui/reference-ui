# `src/` — the host

Neo's TypeScript: everything above the cut. Authors write fragments and
style calls; this tree evaluates them once, compiles through Rust,
publishes the generated folder, and serves the runtime that paints in the
browser.

The pipeline runs in one direction. `config/` loads and validates
`ui.config` — discovery, esbuild bundling, evaluation, validation, plus
the small in-memory store behind path resolution. `fragments/` finds the
author calls (`tokens()`, `font()`, `keyframes()`, `globalCss()`, pattern
extensions), evaluates each file once in Node, and merges the results
into one `EvaluatedSystemSpec`. `sync/` drives the whole pass: prepare
fragments, hand the frozen compile request to the native engine, then
publish the generated `system`, `styled`, and `react` legs and link them
into the project. Nothing here lowers styles; the wire format lives in
`reference-rs/contracts/`, and the stylesheet comes back from Rust.

The other half faces the browser. `runtime/` holds the authored `css()`
and `recipe()` resolvers over the natively compiled plans — the runtime
picks classes, constructs the miss class on a miss, and warns once in dev.
`primitives/` holds the native tags: the factory that splits style props
from DOM props and stamps the layer, color-mode, and variant attributes,
plus the generator that writes the `react` entry (its stable surface
also types worlds under the pre-run check). `author/` is the single
entry behind the `@reference-ui/neo` id that fragment files and configs
import. `lib/` carries Neo-owned seams copied from core rather than
imported: generated-folder path resolution and in-memory esbuild
bundling for configs and fragments. A root constants module holds the
one layout name they share.

Refusals (from the Neo README): no style lowering in TS, no second
Atomic, no second `EvaluatedSystemSpec` (wire format lives in
`reference-rs/contracts/`), no thread-pool opera — fragments, one native
compile, publish. A function.
