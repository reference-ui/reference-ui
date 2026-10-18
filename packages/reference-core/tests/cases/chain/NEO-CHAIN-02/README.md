# NEO-CHAIN-02 — diamond extends: two branches republish one base and every adoption resolves

Matrix source: `matrix/chain/T7/tests/e2e/T7-contract.spec.ts` (also homes
the T12 extends legs, a strict assertion-subset). Evidence: `[chain-t7]`
`T7-contract.spec.ts` (both branch backgrounds + shared-base eyebrows),
Neo `src/system/base/fragments.ts` (first-occurrence linearization) and
`src/collect/lib/merge.ts` (later fragments win; hosts merge unique-sorted).

The world extends two branch stand-ins that both publish the same inner base
as one named node, `meta-base`. The app's linearized fragment list keeps that
node once, at its first occurrence (E1, E2): the shared base evaluates once, and
each branch adds only its own node. The case asserts the composed app boots and
all adoptions resolve: each branch-local background plus the shared inner-base
eyebrow on both branches, against the fixture RGB oracles. Node-side,
`evaluated-system.json` pins the merged leaves, `baseSystem.mjs` pins the
published node list with `meta-base` once, and `jsx-elements.json` pins the
merged hosts with the shared entries resolving once.

Out of scope: the layers legs are proven by `tests/cases/layers` (NEO-LAYERS-03
for a repeated listing); this case stays extends-only.

> Search terms: diamond, shared base, duplicate upstream, multi-package, both branches, extends order, T7, T12, NEO-CHAIN-01
