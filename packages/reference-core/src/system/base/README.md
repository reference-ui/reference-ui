# base

Base assembles the published BaseSystem from discovery plus config. Upstream
bundles plus local IIFEs become the fragment, upstream css plus the own block
becomes the portable sheet, configured names union traced names become the
roster, and all three plus the name become the BaseSystem. The props a traced
component keeps for itself ride beside the roster as an owned map, joined from
extends and layers alike. The extends validator guards the chain's input side
with the same contract the assembler emits, so a system that fails validation
can never be published and a published system always validates.

NOT-owns: fragment evaluation, the native compile, writes to disk (the
packager leg owns every write), and jsx tracing itself (the engine traces;
base only joins the names it is given).

The TS fragment path here is the only `extends` implementation. The Rust
resolver is retired: no Core code calls it, and the native request carries
upstream names, not fragments.

Extends claims, each proven by the cases listed, or `open` (no case yet)
or `pending` (case being added, not yet in the tree):

- E1 Linearize. Each `extends` entry gives its published named fragment
  list, upstream first and its own last. Concatenate in declared order,
  keep each name at its first occurrence, then append local fragments.
  (CORE-CHAIN-09, CORE-CHAIN-10; `fragments.test.ts`;
  `prepare.test.ts`.)
- E2 Evaluate once. Each system's fragment is evaluated exactly once; a
  shared base appears once in the republished list. (CORE-CHAIN-02, -09,
  -10.)
- E3 Later wins. For `[B, C]`, C's own leaves beat B's on the same leaf
  path. (CORE-CHAIN-04.)
- E4 Local wins. Local beats every upstream on the same leaf path.
  (CORE-SYNC-10.)
- E5 Diamond. A branch's override survives unless a later system writes
  that path itself. (CORE-CHAIN-09.)
- E6 Transitive stability. If E extends `[D]`, E resolves exactly what D
  resolved on every path E does not write. (CORE-CHAIN-10.)
- E7 No cycles. A self-reference or cycle through any reachable name
  (fragments or streams) is rejected with a named error.
  (CORE-LAYERS-14 legs 2-3; CORE-CHAIN-11.)
- E8 No repeats in one field. A name repeated within one field is
  rejected; a transitive repeat is deduped, not rejected.
  (CORE-LAYERS-14 legs 4-5; CORE-CHAIN-10.)
- E9 Not both. A system in both `extends` and `layers` is rejected.
  Pending: being added to CORE-LAYERS-03 or CORE-LAYERS-14.
- E10 Private stripped. Upstream `_private` is stripped at any depth;
  the system's own `_private` is kept. (CORE-SYNC-17.)
- E11 No fragment globalCss. Upstream `globalCss` is not collected from
  fragments; it ships through streams. Open.
- E12 Font eviction. Font dual-source eviction works across the boundary
  (ported from Rust BAS-TOKEN-07). Open.
- E13 Override warning. A local leaf replacing a different upstream value
  warns once per path, naming the path, the upstream system and both
  values; equal values and `extendSystem` overrides stay silent.
  (CORE-CHAIN-12; `shadow.test.ts`; `extend.test.ts`; CORE-LAYERS-17,
  CORE-LAYERS-18.)
- E14 One merge. `mergeTokenTree` serves fragments, the E13 diagnostic
  and `extendSystem`; under extends, an `extendSystem` result contributes
  one named fragment node, `extend:<base>`, after the base's nodes.
  `extendSystem` runs its overrides through `assertFragmentTree` first, so a
  cyclic, over-deep or over-wide override (more than 100,000 node visits, a
  shared subtree counted per path) throws `TokenTreeError` naming the path and base.
  (`merge.test.ts`; CORE-CHAIN-13; `extend.test.ts`; `extend.bounds.test.ts`;
  CORE-LAYERS-18.)
- E15 Legacy entries. Legacy `{name, fragment}` entries are accepted as
  one opaque node. Accepted limit: the bases a legacy bundle carries
  cannot be deduped, so a legacy entry beside a named entry sharing its
  base evaluates that base twice (E2, E5 do not hold for that mix);
  resyncing the legacy upstream removes it. (`fragments.test.ts`;
  CORE-CHAIN-04, CORE-CHAIN-05.)
- E16 Owned props. A component's own props travel with the published
  system as `jsxOwned` (component name to kept prop names), beside
  `jsxElements`; the publish joins them with the owned maps of every
  `extends` and `layers` entry, and a downstream sync sends that upstream
  set with its spec. Roster names stay extends-only; only owned props
  flow through layers. (`jsx.test.ts`; `validate-owned.test.ts`;
  `assemble.test.ts`; `sources.test.ts`; CORE-CHAIN-14.)
