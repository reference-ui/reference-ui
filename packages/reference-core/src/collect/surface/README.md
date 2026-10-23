# surface — the calls authors touch

Five calls — `tokens()`, `font()`, `keyframes()`, `globalCss()`,
`recipe()` — plus their shapes. This is the only part of collect that
fragment files ever import, so its shape is load-bearing and stays
put. No bootstrap alias points at this barrel: during sync,
`@reference-ui/core` resolves to core's root `index.ts` and
`@reference-ui/system` to `lib/system-alias.ts` (see
`lib/bootstrap.ts`), and both re-export the five calls from here. The collector
factories live here because the calls are built on them, but nothing
outside collect imports the factories: authors get the calls, the
machinery gets the rest.

```text
fragment file ──▶ surface call ──▶ fragment (data + source tag)
```

## What surface does NOT own

Discovery, bundling, evaluation, merging — anything that happens to a
fragment after it is captured. No scanning, no script running, no
spec assembly. Surface captures; lib does everything else.
