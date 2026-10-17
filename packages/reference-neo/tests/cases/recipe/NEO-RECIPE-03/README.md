# NEO-RECIPE-03 — Boolean variants `true`/`false` select distinct classes

The world defines one `toggle` recipe with a boolean `active` axis mapping to
`display: block` / `display: none`. The spec checks each arm compiles to its
own closed class, boolean selections resolve to distinct class strings, and
each probe paints its computed display.

Evidence: Panda v1 test "cva - boolean variant"; ATM-RECIPE-04.

> Search terms: flag prop, binary axis, two-arm, enabled/disabled, recipe/boolean-variants, NEO-RECIPE-01
