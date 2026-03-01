# CLI TODO — baseSystem emission

Goal: `ref sync` emits `dist/baseSystem.mjs` from a package's `extend*` registrations so it
can be consumed via `extends: [baseSystem]` in a downstream `ui.config.ts`.

See `DESIGN_SYSTEMS.md` for the full picture. This tracks only step 1.

---

## 1. Config types — `src/cli/config/types.ts`

Add two fields to `ReferenceUIConfig`:

- `name: string` — required. Identity of this system.
- `extends?: BaseSystem[]` — upstream systems to merge in before this package's own tokens.

Add `BaseSystem` type — the shape of `dist/baseSystem.mjs`:

```ts
interface BaseSystem {
  name: string
  tokens: Record<string, unknown>
  recipes: Record<string, unknown>
  utilities: Record<string, unknown>
  patterns: Record<string, unknown>
}
```

---

## 2. Config validation — `src/cli/config/validate-config.ts`

Enforce `name` is present and non-empty. Error early with a clear message if missing.

---

## 3. `createBaseSystem` — `src/cli/system/config/createBaseSystem.ts`

New function, parallel to `createPandaConfig`. Takes:

- `cwd: string`
- `config: ReferenceUIConfig` — for `name` and `extends`
- `fragments` — the same collected registrations already produced by `runEval`

Steps:

1. Start with an empty merged object
2. For each entry in `config.extends`: deep-merge its tokens, recipes, utilities, patterns in order (left-to-right, last wins)
3. Merge this package's own `fragments` on top
4. Write `dist/baseSystem.mjs` as an ESM export

```ts
export const baseSystem = { name, tokens, recipes, utilities, patterns }
```

---

## 4. `system/run.ts` — call `createBaseSystem` alongside `createPandaConfig`

In `runConfig`, after `runEval` returns fragments:

```ts
await Promise.all([
  createPandaConfig(coreDir, { userDirectories: userDirs, includeCodegen: true }),
  createBaseSystem(cwd, config, fragments),
])
```

Same trigger, same data. No new watch logic required.

---

## 5. Export from `system/index.ts`

```ts
export { createBaseSystem } from './config/createBaseSystem'
```

---

## Done when

`packages/reference-lib` runs `ref sync` and `dist/baseSystem.mjs` is emitted with the correct
token shape. `packages/reference-app` imports it and `ref sync` resolves the merged tokens.
