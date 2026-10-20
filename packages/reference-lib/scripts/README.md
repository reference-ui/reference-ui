# Lib scripts

Build and packaging automation for the library.

The shared esbuild bundle step stages atomic outputs for the package and the matrix fixtures. Post-bundle packaging writes the theme entry, materializes the runtime, rewrites declaration specifiers, and fails on dangling specifiers or pinned sync-register types. Freshness, declaration cleanup, and the consumer smoke gate keep the published artifact honest.
