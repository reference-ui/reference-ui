# ATM-SITE-25 — call-form `css([...])` is a merge list, never responsive

Overmatch station-only (SPEC-V2-29): `css([{...}, {...}, false])` merges
object elements and skips falsy holes silently. Every element lands
unconditioned — the responsive-vs-merge confusion the SITE SPEC warns
about is structurally impossible (value arrays route to `responsive.rs`,
arg arrays to `walk_array_arg`). Only the JSX form was stationed
(ATM-SITE-19); this station pins the call form. Zero diagnostics.

Panda: `pandacss_stylesheet/tests/atomic.rs:1474`
(`array_css_arg_is_a_merge_list_not_a_responsive_array`), in-conditional
`:1680`, cond-element `:1711`.
