# ATL-OBS-02 — aliased imports and namespace members both count as the observed element

Verifies that `import { Div as Box } from '@reference-ui/react'` with `<Box>` and `import * as R from '@reference-ui/react'` with `<R.Div>` both count as the observed element `Div`.
Asserts that a name the config does not list from the same source (`Section`) is never counted, whether it is imported by name or reached through the namespace.
Proves ATL-OBS-02, the binding rules in `src/usage/observe.rs`.
