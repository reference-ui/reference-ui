# UI config loading

Loads, bundles, evaluates, and validates the project config. The loader reads current files on every call with no global registry, esbuild inlines published base systems while leaving other packages external, evaluation runs the bundle as ESM with a timeout error, and validation normalizes the export or throws typed errors. A small in-memory store holds the active config and root; slow evaluations raise the one slow-config warning.
