# ATM-SITE-24 — colliding ternary-spread unions all values, order-independent

a static key plus a spread ternary on
the same key unions every value — the static want plus both arm wants —
whether the static key comes before or after the spread. The engine already
unions (wants are unordered; the merge resolves positionally at runtime),
so this case only files the row. Zero diagnostics.
