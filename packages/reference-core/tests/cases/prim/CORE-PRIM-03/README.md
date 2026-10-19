# CORE-PRIM-03 — `_hover` prop paints on hover; the `data-hover` twin paints without it

The world renders two Divs carrying the `_hover` style prop: a live probe
with a base color, and a twin with a `data-hover` attribute and no base
color. The spec checks the sheet carries one `:is()` wrap and two
utilities, the twin paints through its attribute, and the live probe rests
on its base, paints under a real hover, and releases back after.

Evidence: ATM-COND-02; Panda v1 test ("should extract conditions");
the built lib styles
`:is(:hover, [data-hover])`.

> Search terms: pseudo-class, pointer, conditional, state, state flip, prim/conditional-style, prim/pseudo-class, CORE-COND-02
