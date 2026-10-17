# ATM-SITE-25 — call-form `css([...])` is a merge list, never responsive

`css([{...}, {...}, false])` merges
object elements and skips falsy holes silently. Every element lands
unconditioned — the responsive-vs-merge confusion the SITE SPEC warns
about is structurally impossible (value arrays route to `responsive.rs`,
arg arrays to `walk_array_arg`). Only the JSX form has a case of its own
(ATM-SITE-19); this case pins the call form. Zero diagnostics.
