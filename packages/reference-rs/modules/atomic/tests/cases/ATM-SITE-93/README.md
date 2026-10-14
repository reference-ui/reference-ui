# ATM-SITE-93 — A forwardRef component's destructured props stay its own API at call sites, while props riding rest still extract

Pins the owned-props shadow for a `React.forwardRef` wrapper. The props type
arrives only through the forwardRef generic (`forwardRef<HTMLDivElement,
TileProps>`), so the inner function's parameter carries no annotation of its
own. `Tile` pulls `size` and `tone` out of its props by name and never
forwards them, so `<Tile size="lg" />` mints no want and no `lg` warning.

`p` stays in `rest`, spreads into `Div`, and extracts as usual. `<Div size="2r" />`
is the control: the primitive still folds `size`.

> Search terms: forwardRef, owned props, declared props, destructure, rest spread, shadow, host_owns, owned_props, forwardRef generic, size token

