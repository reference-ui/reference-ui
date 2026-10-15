# ATL-OBS-03 — an unbound tag counts only when the file imports the source and nothing else declares the name

Verifies that an unbound `<Div>` counts when the file imports something from `@reference-ui/react`.
Asserts that it does not count when `Div` is imported from another module, defined as a local function, declared by destructuring, or used in a file that imports nothing from the observed source.
Proves ATL-OBS-03, the unbound-tag rule in `src/usage/observe.rs` and the module-scope declarations in `src/usage/scope.rs`.
