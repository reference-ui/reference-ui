# NEO-TYPE-05 — the system authoring surface typechecks a fragment file

After `sync()`, a fragment importing `defineConfig`, `tokens`, `font`,
`keyframes`, `globalCss`, `getRhythm`, and `baseSystem` from
`@reference-ui/system` compiles clean against the generated `system.d.mts`.
The world is the TYPE-01 token set; the spec pins the committed `paths`
mapping, typechecks the fragment in a temp dir, and asserts the brand probe
paints.

The fragment is materialized at spec time because it cannot live in the repo:
the harness pre-run typecheck resolves `@reference-ui/system` to the stable
surface, whose wide shapes (one-argument `font`) differ from the generated
signatures. No engine rung: the surface is host-authored in `publish.ts`, and
it already declared every D6 name, so no host change was needed.

Evidence: `[decision D6]`.
