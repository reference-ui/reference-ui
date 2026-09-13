# Constants Module

This folder holds the small set of policy constants that are shared across
multiple Tasty modules.

The goal is not to centralize every string literal. A constant belongs here only
when it encodes a cross-module naming or resolution rule that multiple parts of
the pipeline must agree on.

## Shape

- `libraries.rs`: shared library-name sentinels such as the user-owned source library
- `scanner.rs`: scanner-wide filesystem and module-resolution constants

## Boundaries

- keep local implementation details near the code that uses them
- only promote values that are true shared policy
