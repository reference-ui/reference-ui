# Fragments Tests

This directory contains tests for the fragments system.

## Structure

```
tests/
├── fixtures/              # Test fixture files
│   ├── scanner/          # Fixture files for scanner tests
│   ├── runner/           # Fixture files for runner tests
│   └── *.tsx, *.ts       # Shared fixture files for e2e tests
├── collector.test.ts     # Unit tests for fragment collector
├── scanner.test.ts       # Unit tests for fragment scanner
├── runner.test.ts        # Unit tests for fragment runner
└── e2e.test.ts          # End-to-end integration tests
```

## Fixtures

Test fixtures are organized by test type:

- **Root fixtures** (`Alert.tsx`, `Button.tsx`, `Card.tsx`, etc.) - Used by e2e tests
- **`scanner/`** - Fixture files specifically for scanner tests
- **`runner/`** - Helper modules for runner tests

## Running Tests

```bash
# Run all tests
npm test

# Run only fragments tests
npm test -- fragments

# Run specific test file
npm test -- collector.test.ts
```
