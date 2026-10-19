# CORE-CHAIN-02 — diamond extends: two branches republish one base and every adoption resolves

Matrix source: the chain T7 contract spec (also homes
the T12 extends legs, a strict assertion-subset). Evidence: `[chain-t7]`
the T7 contract spec (both branch backgrounds + shared-base eyebrows),
Core fragment linearization (first-occurrence linearization) and
the fragment merge (later fragments win; hosts merge unique-sorted).

The world extends two branch stand-ins that both publish the same inner base
as one named node, `meta-base`. The app's linearized fragment list keeps that
node once, at its first occurrence (E1, E2): the shared base evaluates once, and
each branch adds only its own node. The case asserts the composed app boots and
all adoptions resolve: each branch-local background plus the shared inner-base
eyebrow on both branches, against the fixture RGB oracles. Node-side,
the evaluated-system snapshot pins the merged leaves, `baseSystem` pins the
published node list with `meta-base` once, and the JSX-elements snapshot pins the
merged hosts with the shared entries resolving once.

Out of scope: the layers legs are proven by the layers cases (CORE-LAYERS-03
for a repeated listing); this case stays extends-only.

> Search terms: diamond, shared base, duplicate upstream, multi-package, both branches, extends order, T7, T12, CORE-CHAIN-01
