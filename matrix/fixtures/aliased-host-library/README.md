# @fixtures/aliased-host-library

Prebuilt fixture package for chain T16: a library whose components render
style props on an **aliased host** (`const BadgeShell = Div as …`) behind a
`forwardRef` factory — the `@reference-ui/icons` `createIcon` shape in
miniature.

Its `ui.config.ts` deliberately carries **no `jsxElements`**: StyleTrace
host detection must recognize the alias on its own. If it does not, the
shell utilities (`d_inline-flex`, `ai_center`, `jc_center`, `leading_0`,
`shrink_0`, `c_inherit`) compile to nothing and the consumer renders
unbacked classes — exactly the CSS composition failure this fixture pins.
