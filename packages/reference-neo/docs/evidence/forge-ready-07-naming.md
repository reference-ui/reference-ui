# Forge READY-07 naming: 15 of 16 names confirmed as-is; `Origin` collides with the site-name string and should ship as `BindingOrigin`.

No proposed name appears in `packages/reference-neo/docs/DOMAIN.md` (grep over all 16: zero hits); all 16 live below the cut (`DOMAIN.md:24-26`), and none collide with the atomic README concepts `Want`/`Atom`/`AtomSet`/`CssRuntime`/`Recipe` (`packages/reference-rs/modules/atomic/README.md:52-56`).

| # | Name | Verdict | Basis |
|---|---|---|---|
| 1 | `module_graph` | Confirm | Zero hits repo-wide. Matches workspace convention: dir `modules/base-system` → crate `base_system` (`packages/reference-rs/Cargo.toml:37`), `name = "atomic"` (`packages/reference-rs/modules/atomic/Cargo.toml:2`). |
| 2 | `ModuleRecord` | Confirm | Zero hits. Neighbors `FileValues` (`packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs:102`) and `TraceModule` (`packages/reference-rs/modules/styletrace/src/analysis/model.rs`) are distinct concepts. |
| 3 | `ImportEdge` | Confirm (relocate + extend) | Exists as named-only edge without `local`/kind (`packages/reference-rs/modules/atomic/src/extract/resolver/exports.rs:51`); mission widens the shape, keeps the name. Sibling `ImportMap` (`exports.rs:61`) is subsumed by the move. |
| 4 | `ExportTable` | Confirm (relocate + extend) | Exists with `ExportShape::{Local, Hop}` only (`packages/reference-rs/modules/atomic/src/extract/resolver/exports.rs:22-38`); mission adds `Star`/`Default`, keeps the name. |
| 5 | `Origin` | **Rename → `BindingOrigin`** | **Collision.** `origin` already means site name (`'Div'`/`'css'`) as `Want.origin: Option<Box<str>>` (`packages/reference-rs/modules/atomic/src/atom/want.rs:18`), `ObjectWalk.origin` (`packages/reference-rs/modules/atomic/src/extract/expressions/object.rs:26`), `ExpressionWalk.origin` (`packages/reference-rs/modules/atomic/src/extract/expressions/walk.rs:26`), `css_origin`/`recipe_origin` "Origin string" (`packages/reference-rs/modules/atomic/src/extract/bindings.rs:58-71`). Mission's `Origin { file, name }` / `Origin::Harvest` (`docs/missions/operation-forge.md:970-1027`) means binding declaration site — same crate, two meanings. The old string is serialized in goldens (specs assert `origin` `'Div'`/`'css'`), so qualify the new type, not the old field. |
| 6 | `Refused` | Confirm | No `struct`/`enum`/`trait` by that name (zero hits). Fits the established refusal vocabulary: `TokenOperand::Refused(TokenReason)` (`packages/reference-rs/modules/atomic/src/extract/fold/token_shape.rs:98`), `TokenCalleeStatus::Refused` (`packages/reference-rs/modules/atomic/src/extract/scope/collect.rs:350`) — both are variants, so no symbol clash. |
| 7 | `SpecifierLadder` | Confirm | Zero hits as a symbol; promotes existing prose "the specifier ladder finds the target" (`packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs:3`) to a type. |
| 8 | `FileSystem` | Confirm | Zero hits (no trait/struct). Neighbor resolvers are free functions/methods (`resolve_external_import_path`, `packages/reference-rs/modules/tasty/src/scanner/packages.rs:67`; `resolve_module_specifier`, `packages/reference-rs/modules/styletrace/src/resolver/tracer/context.rs:78`) — no clash. |
| 9 | `DiskFs` | Confirm | Zero hits. |
| 10 | `MemoryFs` | Confirm | Zero hits. |
| 11 | `ValueGraph` | Confirm (+ retire note) | Zero hits; no existing `value_of`/`resolve_binding` fns. Neighbor `ProjectGraph` (files + cache, `packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs:138`) must be retired or merged in Slice 3 so two "graphs" never coexist. |
| 12 | `HarvestPool` | Confirm | Zero hits. |
| 13 | `Sink` | Confirm, scoped as `harvest::Sink` | Bare `Sink` zero hits, but two neighbors exist: `EntrySink` (pub(crate), `packages/reference-rs/modules/atomic/src/extract/scope/value.rs:114`) and `ExtractSinks` (pub, `packages/reference-rs/modules/atomic/src/extract/mod.rs:63`). Keep the harvest type under `harvest::sinks` so all three stay grep-able. |
| 14 | `ValueKind` | Confirm | Zero hits. Fits canon's predicate style: `is_color_prop` over `COLOR_PROPERTIES` (`packages/reference-rs/modules/canon/src/css/mod.rs:49-54`); distinct from `AtomValue` (`packages/reference-rs/modules/atomic/src/atom/want.rs:15`). |
| 15 | `BagSemantics` | Confirm | Zero hits. Extends the established "bag" vocabulary: `FileValues.bag: LocalConstants` (`packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs:103`), "merged bag" (`packages/reference-rs/modules/atomic/src/extract/resolver/mod.rs:8`). |
| 16 | `owned_props` | Confirm | Zero hits. Fits `StyleSurface`'s snake_case set fields `style_props`/`primitives` (`packages/reference-rs/modules/styletrace/src/analysis/surface.rs:25-27`). |

## Collision summary

- Hard collision (1): `Origin` — site-name string vs binding-declaration struct. Fix by naming the new type `BindingOrigin` (`BindingOrigin::Harvest`, `value_of(BindingOrigin)`); mission §B/`walk.rs`/`mint.rs` references update mechanically, shapes unchanged.
- Soft neighbors (2, no rename): `Sink` vs `EntrySink`/`ExtractSinks` (scope under `harvest::`); `ValueGraph` vs `ProjectGraph` (retire the latter in Slice 3).
- Clean relocations (2): `ImportEdge`, `ExportTable` move from `atomic::extract::resolver::exports` to `module_graph::record` with wider shapes.
- Clean remainder (11): zero repo-wide hits for `module_graph`, `ModuleRecord`, `SpecifierLadder`, `FileSystem`, `DiskFs`, `MemoryFs`, `ValueGraph`, `HarvestPool`, `ValueKind`, `BagSemantics`, `owned_props` (Rust `struct`/`enum`/`trait` sweeps plus `packages/reference-neo/src` and `packages/reference-core/src` identifier sweeps all empty).

Slice note: Slice 3 consumes this pass — ship `BindingOrigin`, retire `ProjectGraph` on `ValueGraph` adoption, and keep the harvest type at `harvest::Sink`.
