# CORE-SITE-21 — impure helper leaves refuse while static siblings paint

The world styles two nodes mixing an impure-helper color leaf (a
`Math.random` helper, an async call) with a static margin sibling, plus
a third node whose fenced pure-helper color paints. The
spec checks the sheet carries the three margin utilities plus the pure
color, the margins paint, the refused colors paint nothing, the pure
color paints blue, and the frozen-request recompile carries the two
positioned warnings. The pure arm uses blue (the refused arms resolve
to red at runtime) so the refuse isolation holds through the runtime
lookup table.

Evidence: ATM-SITE-32, ATM-SITE-31; Panda v2 scope tests.

> Search terms: impure helper, tripwire, refuse pins, Math.random, async call, sibling paints, pure helper paints
