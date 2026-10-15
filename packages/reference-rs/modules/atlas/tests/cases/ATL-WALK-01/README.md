# ATL-WALK-01 — JSX in class bodies, optional calls, throw, template literals and new arguments is counted

Verifies that a component used only inside a class `render()`, the argument of an optional call (`render?.(...)`), a `throw` expression, a template literal `${...}` or a `new` constructor argument still shows up in component stats with one call site each.
Asserts that the observed `Button` placed inside each of those five forms is counted five times, once per form, so primitive stats see the same JSX the component pass sees.
Proves ATL-WALK-01, the JSX walker in `src/usage/walker.rs`, which walks the whole program with oxc's `Visit` trait.
