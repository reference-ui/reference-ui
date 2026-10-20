# Docs quality gate

Lint, types, and hygiene over the docs sources.

It walks the docs paths and runs two linter passes — one failing, one loud — plus a strict typecheck, a banned-suppression scan, and a file-length tier. Findings print one greppable line each with nonzero exit on failure.
