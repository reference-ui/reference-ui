# Tasty native sources

TypeScript scanning into portable metadata bundles for docs and MCP use. The scanner discovers workspace files and resolves imports; the AST layer extracts symbols and resolves them into a connected graph; the generator emits the manifest-first bundle with per-symbol chunks; the emitted contract types pin the wire shapes the runtimes consume.
