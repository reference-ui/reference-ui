# CORE-TYPE-05 — the system authoring surface typechecks a fragment file

After `sync()`, a fragment compiles clean against the generated `system.d.mts`.
It imports `defineConfig`, `tokens`, `font`, `keyframes`, `globalCss`, `getRhythm`,
and `baseSystem` from `@reference-ui/system`. The world is the TYPE-01 token set;
the spec pins the committed `paths` mapping, typechecks the fragment in a temp
dir, and asserts the brand probe paints.

The fragment is materialized at spec time so the repo never carries it: the
harness pre-run typecheck resolves `@reference-ui/system` to the stable surface,
so a fragment checked there would prove the surface, not the generated entry.
No engine rung: the surface is host-authored in the styled-types publisher, and
it already declared every name, so no host change was needed.


> Search terms: theme, setup, entry point, dsl, type/system-entry, type/authoring, CORE-TYPE-01
