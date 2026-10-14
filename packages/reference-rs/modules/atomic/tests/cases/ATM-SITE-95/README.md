# ATM-SITE-95 — A compiled icon package's own size prop is not a style on its external tag at call sites

The docs icon path. `icon-pkg` ships compiled dist only (`dist/*.mjs`, no generics,
`jsx()` calls from react/jsx-runtime), the way `@reference-ui/icons` does, so the
trace reads no declaration for `CodeIcon` and finds no host in it
(`tracedJsxHosts` stays empty). `CodeIcon` is a `createIcon` product whose inner
forwardRef destructures `size` and `variant` and consumes them. The consumer
imports it, so the tag is external.

What the compiled package cannot say, its published roster does. The base system
carries `jsxOwned: { "CodeIcon": ["size", "variant"] }` (`input/baseSystem.json`),
the way Neo hands an upstream's owned props to a consumer compile. The gate reads
it like a traced owned set: `<CodeIcon size="lg" />` mints no want and no `lg`
warning, while `color` is not owned and still extracts as an external want.
`<Div size="2r" />` is the control: the primitive still folds `size`.

The owned map the gate read rides the result as `tracedJsxOwned`, on the slim
production wire as well as the proof channel.

> Search terms: compiled dist, external component, createIcon, size token, owned props, jsx-runtime, jsxOwned, tracedJsxOwned, roster
