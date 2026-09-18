# Hosts

StyleProps gating resolves from two name sets: caller-configured `jsxHosts`
plus engine-traced component names, unioned before extraction so configured
hosts and discovered wrappers compile without a file-local import.

Tracing runs against the engine-owned surface (runtime prop names, typegen
condition keys, canon primitives) over the same include-scoped entries
extraction compiles. No `root_dir` or an empty entry set traces nothing,
silently — virtual-only compiles gate on configured hosts alone.

## Must not

- Warn when there is nothing to trace (empty entries stay silent).
- Fail the compile when one entry is unparsable (one located warning, siblings continue).
- Gate on a stale surface (the surface rebuilds from the request system per compile).
