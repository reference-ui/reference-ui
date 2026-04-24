# TypeScript Matrix

This package is the dedicated matrix suite for TypeScript-facing behavior.

Its job is to validate generated declaration consumption and consumer-facing type behavior separately from the install-focused scenario in `matrix/install`.

Examples of the kinds of checks that belong here:

- generated declaration consumption
- TypeScript config compatibility
- type inference and public API usage checks
- downstream compile-only scenarios

The focus here is the TypeScript consumer experience rather than runtime install behavior.