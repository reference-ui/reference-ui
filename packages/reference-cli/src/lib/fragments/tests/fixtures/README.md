# Test Fixtures

Clean, minimal fixtures representing realistic user code.

## Files

- **`define-function.ts`** - The collector function (like `extendPandaConfig`)
- **`use-function.ts`** - Simple usage example
- **`with-constants.ts`** - Usage with constants
- **`has-call.ts`** - File with function call (for scanner)

## Design

All fixtures are **realistic user code**. No test infrastructure.

`define-function.ts` implements the collector pattern using `globalThis`, just like `extendPandaConfig` does in production.
