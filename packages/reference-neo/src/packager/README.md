# Packager

The packager is part of the build system: it takes compile output plus
the evaluated spec and actually packages it properly — creating the
real packages inside the `.reference-ui` folder that a project
resolves: `@reference-ui/system`, `@reference-ui/styled`,
`@reference-ui/react`, `@reference-ui/types`.
It owns the package set as declarative definitions, the manifests
written from them, the externals policies every bundler obeys, the
assembly order, and the named postprocess passes. Sync calls one
entry with the compile output; everything inside this folder is
packaging, everything outside is some other subsystem's job.

A definition describes what one generated package looks like — name,
version stamp, manifest entries, the extra files copied in, the
postprocess passes by name — and the legs execute that description.
Manifests therefore change in exactly one place, and the link set
derives from the same definitions, so the published packages and the
project links can only agree with each other.

The assembly runs serially by construction: shells first, then the
runtime data, then the bundles that read it, then the declarations
wired onto the bundles. Sync commits the assembled stage live and
links the packages after, so every junction lands on a complete
package. There are no workers, no thread pool, no event bus:
natives compile fast and serial, and an ordered await chain is the
whole orchestration.

Two externals policies govern two bundling positions. The generated
bundles externalize their host-provided edges (React rides with the
consumer; styled and types stay edges of the types bundle), while
every bundle stays self-contained for its own system. Shippable
system units — packed fixtures consumed across package boundaries —
externalize nothing system-bound at all: they inline the runtime, so
a fixture dist resolves to its own system identically in the
workspace and from a packed tarball. That policy is the HERMDIV fix
as code, and the hermetic chain gate pins it behaviorally.

A shippable unit ships its self-contained dist plus the baseSystem
pair. The dist carries the runtime because `css()` is system-bound:
classes embed the owning system's name, so a consumer-provided
bundle would emit the consumer's classes for fixture components.
The layer fixtures always shipped this shape; the packager extends
the policy to every fixture and owns the externals list their build
configs import, so the shape can only drift in one place.

One postprocess pass survives from the legacy line: the types
runtime rewrite, which swaps the placeholder the entry compiles
against for the literal tasty edge app bundlers must see. It stays
a pure string transform with triple-guard semantics — present
before, gone after, literal after — so it unit-pins without
touching the filesystem. The legacy layer-name injection has no
counterpart here: the system name bakes in at generation, so no
placeholder exists to inject. The legacy worker lifecycle, the
TypeScript declaration fan-out, and the build-copy install mode
were all deliberately left behind: Neo's typegen plus a single
declaration leg cover types, and junctions carry every install.
Write-if-changed gating came back, but in the commit instead of
the legs: legs write the stage unconditionally, and the commit
skips identical bytes so watchers never see a no-op resync.
