# reference-test Architecture

Radically simple structure. See **plan.md** for what we're testing.

---

## Structure

```
packages/reference-test/
├── src/
│   ├── tests/                # Core test suite
│   │   └── core-system.test.ts
│   ├── lib/                  # Supporting modules
│   │   ├── browser.ts
│   │   ├── runner.ts
│   │   ├── project.ts
│   │   └── assert.ts
│   ├── environments/
│   │   └── bootstrap.ts
│   └── index.ts              # Public API
├── plan.md
├── architecture.md
└── package.json
```

---

## Flow

```
1. environments/bootstrap(config)  →  create temp project (React + bundler)
2. Load tests/ + lib/ into that context
3. Run core-system.test against the project
4. Cleanup
```

---

## Responsibilities

| Folder | Role |
|--------|------|
| **tests/** | What to assert. Sync ran. Build succeeded. Styles applied. |
| **lib/** | How to do it. Browser, runner, project generation, assertions. |
| **environments/** | Wire it up. Bootstrap project. Invoke tests with lib available. |

---

## MVP

One environment: Vite + React 18. One test. One token assertion. Prove the flow works.
