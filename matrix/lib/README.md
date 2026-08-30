# Library matrix

Playwright proof for `@reference-ui/lib` primitives.

Agents run Playwright on the host against one spec file. Pipeline can target
this package alone, and `--react` can pin one declared runtime so that job
stays small.

See `packages/reference-lib/TESTING.md`.

```bash
cd matrix/lib
pnpm exec playwright test tests/e2e/overlay.spec.ts
```
