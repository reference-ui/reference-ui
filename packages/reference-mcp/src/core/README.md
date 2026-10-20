# MCP core seams

Compiler-side loading owned locally for distribution safety.

Config bundling, config loading, author-entry resolution, and generated-folder paths mirror the compiler seams. They are vendored rather than retargeted because compiler path computation breaks once bundled and because pipeline modules are reachable from the types entry, where an unresolvable specifier would break consumers.
