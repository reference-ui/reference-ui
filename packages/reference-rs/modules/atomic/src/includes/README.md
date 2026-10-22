# Include scoping in atomic

Atomic's include scope lives in `shared::includes`. That module holds the pattern matcher, the glob automaton and the directory state the disk walk keys on. This folder re-exports that scope so every `crate::includes` path keeps resolving, and it keeps the compile-level pins for case ATM-SCAN-01: an include list scopes the virtual files and the disk scan of one request, and an open list keeps every legacy file. The matcher's verdicts and the automaton's agreement with `glob::matches` are tested beside the code, in `shared`.
