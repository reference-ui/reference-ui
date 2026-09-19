# ATM-SITE-24 — colliding ternary-spread unions all values, order-independent

Overmatch station-only (SPEC-V2-22): a static key plus a spread ternary on
the same key unions every value — the static want plus both arm wants —
whether the static key comes before or after the spread. The engine already
unions (wants are unordered; the merge resolves positionally at runtime),
so this station only files the row. Zero diagnostics.

Panda: `conditional_output.rs:363`
(`ternary_spread_colliding_with_static_parent_unions_all_values`),
before-order twin `:389`.
