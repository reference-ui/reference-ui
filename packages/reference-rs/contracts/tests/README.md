# Contract tests

Verification suite for the frozen wire fixtures. `contracts.test.ts` asserts the committed JSON satisfies the TypeScript interfaces for every frozen boundary, checks positive invariants (`schemaVersion` 1, `reference-ui` profile, owner on plans), and confirms the negative fixtures are rejected.
