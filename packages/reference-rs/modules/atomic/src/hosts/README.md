# Hosts

StyleProps gating resolves from two name sets: caller-configured `jsxHosts`
plus engine-traced component names, unioned before extraction so configured
hosts and discovered wrappers compile without a file-local import.

Tracing runs against the engine-owned surface (runtime prop names, typegen
condition keys, canon primitives) over the same include-scoped entries
extraction compiles. No `root_dir` or an empty entry set traces nothing,
silently — virtual-only compiles gate on configured hosts alone.

Owned props (§14) have the same two sources. The trace contributes the prop
names each exported component declares and keeps for itself, whether or not
that component traces, and the base system's `jsxOwned` speaks for published
components that have no source to trace, such as a compiled icon package. A
component's own declared props (destructured, not forwarded) are never styles,
whether or not the component is a host: a component that reaches no primitive
is not a host, but a call site that names it still reads those props as its
own, never as styles. Both sources are unioned as sets into the owned map on every path (traced,
lane-folded, configured-only, vacant), the extraction gate reads it by tag
name, and the compile result reports the union as `tracedJsxOwned`.

A component its module never exports has no export name to key, so the trace
also reports each module's own components' owned props by path and local
name. Extraction and analysis read them only for that file, beside the
global map: a local `LocalButton` that turns `size` into `data-size` owns
`size` at its own call sites without shadowing a same-named component that
another file imports.

A source that is not on disk is never traced: it cannot be an entry, and no
import edge resolves to it. Serial and lane folds share that rule
(`on_disk_source`), so a virtual wrapper adds no traced host on either path;
only configured `jsxHosts` admit it.

## Must not

- Warn when there is nothing to trace (empty entries stay silent).
- Fail the compile when one entry is unparsable (one located warning, siblings continue).
- Gate on a stale surface (the surface rebuilds from the request system per compile).
- Skip the declared owned props on any path, including the ones that never trace.
