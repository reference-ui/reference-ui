# Tabs hooks

Tabset state behind one hook per behavior. `use-tabs-registry` owns
identity claims, entries, ARIA id lookups, linkage settlement, and the
one-List count. `use-tabs-order` derives DOM-ordered lists and
nearest-enabled fallback through the registry kernel. `use-tabs-value`
resolves the optional value with its natural-zero seed and unmatched
warning. `use-tabs-diagnostics` verifies one List and one pair per
value per commit. `use-focus-trails` owns the shared panel/tab focus
trails; `use-focus-rescue` and `use-tab-handoff` read them to rescue
stranded focus and hand off from broken tabs. The root calls each once
and memoizes the context they compose.
