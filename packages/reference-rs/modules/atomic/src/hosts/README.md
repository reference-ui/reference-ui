# Hosts

StyleProps gating resolves from two name sets: caller-configured `jsxHosts`
plus engine-traced component names, unioned before extraction so configured
hosts and discovered wrappers compile without a file-local import.

Tracing runs against the engine-owned surface (runtime prop names, typegen
condition keys, canon primitives) over the same include-scoped entries
extraction compiles. No `root_dir` or an empty entry set traces nothing,
silently — virtual-only compiles gate on configured hosts alone.

Owned props (§14) have the same two sources. A traced host contributes the
prop names its declaration keeps for itself, and the base system's `jsxOwned`
speaks for published components that have no source to trace, such as a
compiled icon package. Both are unioned as sets into the owned map on every
path (traced, lane-folded, configured-only, vacant), the extraction gate reads
it by tag name, and the compile result reports the union as `tracedJsxOwned`.

A source that is not on disk is never traced: it cannot be an entry, and no
import edge resolves to it. Serial and lane folds share that rule
(`on_disk_source`), so a virtual wrapper adds no traced host on either path;
only configured `jsxHosts` admit it.

## Must not

- Warn when there is nothing to trace (empty entries stay silent).
- Fail the compile when one entry is unparsable (one located warning, siblings continue).
- Gate on a stale surface (the surface rebuilds from the request system per compile).
- Skip the declared owned props on any path, including the ones that never trace.
