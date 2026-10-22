# Styletrace fixtures

Workspace-level trace fixtures outside the station corpus. The sync-root tree is a mock app root with sources and a UI config that resolver and analysis tests trace against for sync-root hints and repo-level scenarios.

## The committed `.reference-ui` stand-in

`sync-root/.reference-ui` is committed, not generated. It is a hand-written stand-in for the synced `@reference-ui/react` and `@reference-ui/styled` declarations. It holds the primitives (`Button`, `Div`, `Span`, `Svg`) and the StyleProps names (`color`, `backgroundColor`, `margin`, `weight`, `width`, `height`) that the Rust and Vitest suites resolve. Cargo tests have no setup hook, so both suites read this copy directly and need no setup step. The root `.gitignore` re-includes that one path.

## Regenerating

`sync-root/ui.config.ts` has a non-empty `name`, which the core config check requires. Without it, `ref sync` refuses with "Config must have a non-empty 'name'". With it, a real sync accepts the fixture and writes the full generated `.reference-ui` tree.

Run the sync in a copy, never in place. A sync replaces `.reference-ui` with its full output, and inside this directory that output would appear in git.

```sh
pnpm --filter @reference-ui/core run build   # only if packages/reference-core/dist/bin/ref.js is missing
SCRATCH="$(mktemp -d)"
cp -R packages/reference-rs/modules/styletrace/fixtures/sync-root "$SCRATCH/sync-root"
node packages/reference-core/dist/bin/ref.js sync "$SCRATCH/sync-root"
```

Then bring into the committed stand-in only what a test needs: a primitive as its `<Name>Props` alias and `export declare const <Name>` line, taken from `react/react.d.mts`, and a StyleProps key from `styled/types/index.d.ts`. Do not paste the generated tree in. Finish with `pnpm agentrs c styletrace` and `pnpm agentrs v styletrace`.
