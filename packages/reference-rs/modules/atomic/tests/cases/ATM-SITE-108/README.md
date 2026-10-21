# ATM-SITE-108 — A folded JSX bag is silent on unknown keys and lowers css; css({...}) still warns

A pure helper returns the bag `{ readOnly, onPointerDown, css }`, which a JSX host spreads.
Under JSX attribute semantics the host owns `readOnly` and `onPointerDown`, so neither warns,
and `css` recurses like the css attribute, so its colour lowers beside the padding sibling of
`<Div {...attrs()} padding="2r" />`. The same fold spread into `css({...attrs()})` keeps
style-object semantics and warns for each key that is not a style prop.

Symbols: `lower_call_spread`, `lower_call_entry`, `lower_call_css`, `lower_call_r_attr`, `BagSemantics::JsxAttributes`, `spread_pure_call`, `lower_const_object`.
Siblings: `ATM-SITE-83` (recorded and inline JSX spread bags), `ATM-SITE-31` (folded call spreads into css() and JSX), `ATM-SITE-81` (member-path objects).
Contract: SPEC.

> Search terms: folded spread, JSX spread bag, attribute bag, unknown property, readOnly, onPointerDown, css recursion, pure helper spread, bag semantics
