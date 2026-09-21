# Value graph

Demand-driven import values over the shared module graph. Each file's
import bindings resolve to the declared export in THAT file — never to a
project-wide name bag — so two files declaring the same name never cross,
and a same-named write in another file never poisons an import that
resolves to an unmutated export.

The shared crate owns the ladder, the module records, and the origin walk;
this layer owns values only. Records stage for the census, but literal bags
and loader entries stage only for files that carry outgoing edges or that
edges reach; unreached files unstage, and the loader's miss path serves them
bit-identically on the rare reach. An origin file's scope table refines on
demand when something first imports it, baking against its own resolved
imports instead of the merged bag. Nested import spreads merge origin objects
transitively, helper captures resolve through the graph, and refused
spreads record residue markers that the importing file's use sites
diagnose — so no dropped spread is ever silent.

Externals (packages and scope-excluded targets) parse once on demand into
values-only entries with literal bags and no descriptors. Refused,
namespace, and default imports stay out of the map; mutated origins enter
value-empty with the origin write, so uses drop naming that write.
