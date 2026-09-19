# ATM-SITE-73

Literal `css()` calls inside function bodies and JSX expression containers
extract, several calls per source each extract, and five-arg `css()`
merges every arg. Pins the SPEC-V2-38 discovery half (v2 `calls.rs:480`,
`:657`, `:702`; multi-arg `atomic.rs:1449`, `:1596`).
