# Styletrace Tests

Rust tests are split by concern so resolver failures and wrapper-analysis
failures stay easy to diagnose.

## Layout

Shared scratch directories and case-fixture lookup live in one fixtures module.
Resolver coverage (the type-surface resolver) and wrapper-analysis coverage are
kept apart. Compound-member alias coverage is split by topic: local and imported
targets, reassignment, shapes that stay silent, barrel re-exports, and export
collisions, with the `forwardRef` variants in their own module.
