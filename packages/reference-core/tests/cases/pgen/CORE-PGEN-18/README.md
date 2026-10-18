# CORE-PGEN-18 — condition arms and null-hole arrays assign; bare sm fails TS2353.

Hover arms and a `{ base, md }` breakpoint object assign against the vendored
E4, responsive arrays with null holes assign at value positions, and bare sm
is provably absent from the style keys at the type level. A bare-sm keyed
object fails with TS2353: breakpoints key a value or a css block, never a
primitive's props, because the JSX extractor and the prop splitter treat a
bare `sm` prop as an element attribute. Related: CORE-PGEN-15 (arms in family
probes), CORE-TYPE-04 (the per-system precedent).

The breakpoint object resolves through the world's own `BreakpointKey`, which
E4 reaches through the styled graph rather than declaring itself — the
positive file proves that composition compiles. Named condition arms are the
only condition props admitted; holds on the unbound file exactly as on the
bound entry.
