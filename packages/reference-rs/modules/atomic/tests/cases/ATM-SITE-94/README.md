# ATM-SITE-94 — A factory-built icon keeps its destructured size as its own API at call sites, while props riding rest still extract

Mirrors the `createIcon` factory in `@reference-ui/icons`. `createIcon` builds a
`React.forwardRef` whose props type sits only in the generic
(`forwardRef<HTMLDivElement, MaterialSymbolIconProps>`), and the inner
function pulls `size` out by name. `CodeIcon = createIcon(...)` is the
exported product.

`<CodeIcon size="lg" />` must mint no want and no `lg` warning, because the
inner function consumes `size` itself and never forwards it. `p` stays in
`rest`, reaches the `Div` shell, and extracts. `<Div size="2r" />` is the
control: the primitive still folds `size`.

> Search terms: createIcon, factory, forwardRef, icon size, owned props, destructure, rest spread, size token, MaterialSymbolIconProps, host_owns
