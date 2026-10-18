# NEO-TYPE-08 — css() keeps the full key surface on colors-only tokens

After `sync()` on a colors-only world (the Cause-B shape: no spacing or radii
categories), one generated `css()` call accepts the fixture prop set
(`borderRadius`, `padding`, `display`, `flexDirection`, `gap`, `borderStyle`,
`borderWidth`), the docs Leg-A set (`fontSize`, `fontWeight`,
`textDecoration`, `flex`, `minWidth`, `letterSpacing`, `cursor`, `transition`,
`boxShadow`, `textUnderlineOffset`), numerics (`width: 42`), and a custom
property (`'--custom': 1`) with `tsc --noEmit` exit 0. A bogus prop in the
same position is TS2353. Keys follow the compiler, not the token categories.

The consumers are materialized at spec time because they cannot live in the
repo: the harness pre-run typecheck resolves `@reference-ui/react` to the
wide surface, which would accept the negative. Token-less families stay
usable through the open `(string & {})` hatch; only the keys widened.

Evidence: typegen TYP-SURFACE T1 (canon-enumerated full-surface positive);
matrix `extend-library` `DemoComponent.tsx` (colors-only consumer).

> Search terms: typegen widening, StyleProps keys, colors-only, css call-site excess property, TS2353, Cause-B, NEO-TYPE-02, TYP-SURFACE
