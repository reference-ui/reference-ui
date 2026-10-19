# CORE-CHAIN-08 — style props on a real prebuilt dist, not a same-scope stand-in

Every other chain case exercises token adoption through `extends` in one
compiling scope. This case styles a component the app never compiles: the world
carries a **prebuilt package component fixture** (`prebuilt/badge.mjs`) built
the same way a published dist is — it renders a primitive from its own
materialized, bound `react.mjs`, so every style prop it forwards qualifies
with the **package's** system name (`core-chain8-up`), never the consumer's.
The consumer renders `<Badge color="chain8Ink" />` with a token defined only
downstream, so a painted value proves the consumer compile resolved and
emitted a rule for the foreign-qualified class the package runtime mints.
A consumer compile that drops the prop, or backs it under any system but
the package's, leaves the element carrying `core-chain8-up__c_chain8Ink`
with no backing rule, so it faints and the runtime warns `no compiled class`.
That polarity is the point — a same-scope `Div` twin would pass vacuously and
is refused here.

The consumer sync learns which system renders `<Badge>` from the package the
import lands in, the way Node would resolve it: the spec installs the synced
upstream as `world/node_modules/@fixture/prebuilt` before the extended re-sync
(and removes it after), so the engine reads the system it published,
`core-chain8-up`, and backs the class under that system only. The browser keeps
loading the component through the world importmap.

Evidence: the extract's tag gate backs a non-host tag under the systems the
package its import lands in published (`non_host_gate` in
`packages/reference-rs/modules/atomic/src/extract/jsx/mod.rs`,
`extract/package_system.rs`), while the package's runtime mints the class
under its own system (`css()` in `packages/reference-core/src/runtime/css/css.ts`);
no twin without a real prebuilt dist. Siblings: ATM-SITE-96 (the same backing
inside one compile), CORE-CHAIN-15 (an installed package's import shapes).

> Search terms: prebuilt dist, package backing, published system, external style props, bound react.mjs, foreign qualifier, same-scope vacuous twin, CORE-CHAIN-06, CORE-CHAIN-07
