# Tasty runtime internals

The machinery behind the public API. Node and browser runtimes load and validate the manifest; artifact loading resolves and imports modules with cache-busting queries; the chunk loader caches per-chunk imports; the symbol resolver serves symbols by id or name; interface flattening, generic instantiation, object projection with Pick/Omit keys, reference following, and type description, guards, and wrappers evaluate the graph; error and shared helpers round out the surface.
