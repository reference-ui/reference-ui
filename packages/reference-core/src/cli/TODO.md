# CLI TODO — baseSystem emission

Goal: `ref sync` emits a bundled config that `extends[]` reads. The artefact is the merged
tokens/recipes/utilities/patterns — we may need a thin wrapper around it. It's called **baseSystem**.

See `DESIGN_SYSTEMS.md` for the full picture. This tracks step 1.

---

## Epicenter: `system/`

`packages/reference-core/src/cli/system` is where this work happens.

**Two mechanisms:**

1. **Bundle a system** — collect fragments (from eval), merge upstream if any, emit `baseSystem.mjs`
2. **Load extends** — when config specifies `extends`, load those upstream systems and merge them into the system being built (both for the emitted baseSystem and for the Panda config)

So the system worker: if `config.extends` is present, incorporate those upstream baseSystems into the compiled output. If not, bundle only the local fragments.

---

## Architecture Context

**reference-core dynamically compiles and exports baseSystem.** That is core's job — for each sync
instance, core produces the bundled config. Users import `baseSystem` from the package that ran
`ref sync` (e.g. `@reference-ui/library`), but the compilation and emission logic lives in core.

**reference-lib is the consumer.** reference-lib runs `ref sync` and re-exports the emitted
`baseSystem`. reference-core is the platform (CLI, `defineConfig`, `extend*` API); reference-lib
is the first design system built on it — colours, components, opt-in layer.

**Two run contexts:**

| Runner       | cwd               | coreDir        | Outputs                                                           |
| ------------ | ----------------- | -------------- | ----------------------------------------------------------------- |
| reference-lib | reference-lib root | reference-core | `reference-lib/dist/baseSystem.mjs` (bundled config for `extends`) |
| reference-app | reference-app root | reference-core | Panda config merged with upstream `baseSystem`, no baseSystem emit |

**Event flow:** `createBaseSystem` runs in the **system worker** alongside `createPandaConfig`.
Same trigger (`runConfig`), same fragments from `runEval`. No new events or init order changes.
See `event-flow.md` for the full chain: virtual → system → gen → packager → packager-ts.

**Output locations:**
- `createPandaConfig` → `coreDir/panda.config.ts` (existing)
- `createBaseSystem` → `cwd/dist/baseSystem.mjs` (new; bundled config read by `extends[]`; thin wrapper TBD)

---

## 1. Config types — `src/cli/config/types.ts`

Add two fields to `ReferenceUIConfig`:

- `name: string` — required. Identity of this system (CSS @layer, `data-layer` selector).
- `extends?: BaseSystem[]` — upstream systems (bundled configs) to merge in before this package's own tokens.

Add `BaseSystem` type — the shape of the bundled config read by `extends[]`:

```ts
interface BaseSystem {
  name: string
  tokens: Record<string, unknown>
  recipes: Record<string, unknown>
  utilities: Record<string, unknown>
  patterns: Record<string, unknown>
}
```

A thin wrapper around the raw bundle may be needed; TBD.

---

## 2. Config validation — `src/cli/config/validate-config.ts`

Enforce `name` is present and non-empty. Error early with a clear message if missing.

---

## 3. `createBaseSystem` — `src/cli/system/config/createBaseSystem.ts`

New function, parallel to `createPandaConfig`. Emits the bundled config that `extends[]` reads.

Takes:

- `cwd: string` — package root (where `ui.config.ts` lives); output goes to `cwd/dist/`
- `config: ReferenceUIConfig` — for `name` and `extends`
- `fragments` — the same collected registrations already produced by `runEval`

Steps:

1. Start with an empty merged object
2. For each entry in `config.extends`: deep-merge its `tokens`, `recipes`, `utilities`, `patterns` in order (left-to-right, last wins)
3. Merge this package's own `fragments` on top
4. Write `cwd/dist/baseSystem.mjs` as an ESM export:

```ts
export const baseSystem = { name, tokens, recipes, utilities, patterns }
```

Ensure `dist/` exists (mkdir -p). For reference-lib with `extends: []`, step 2 is a no-op; step 3 merges only the local fragments. A thin wrapper may be added around this export.

---

## 4. `createPandaConfig` — extend to merge `config.extends`

When a consumer (e.g. reference-app) has `extends: [baseSystem]`, the Panda config must include
those upstream tokens. Update `createPandaConfig` to:

1. Accept `config: ReferenceUIConfig` (or equivalent) with `extends`
2. Deep-merge each upstream `baseSystem`'s tokens/recipes/utilities/patterns into the config before writing

The existing fragment merge stays; this adds pre-merge of `config.extends` when present.
Without this, reference-app cannot resolve tokens from `baseSystem` in step 1.

---

## 5. `system/run.ts` — call `createBaseSystem` in `runConfig`

In `runConfig`, after `runEval` returns fragments:

```ts
await createPandaConfig(coreDir, { userDirectories: userDirs, includeCodegen: true, config })
await createBaseSystem(cwd, config, fragments)
```

Pass `config` into `createPandaConfig` for the `extends` merge (see §4). Both run in the same `runConfig` call — same trigger, same data. No new watch logic or events.

---

## 6. Export from `system/config/index.ts`

```ts
export { createBaseSystem } from './createBaseSystem'
```

---

## Done when

1. `packages/reference-lib` runs `ref sync` and `dist/baseSystem.mjs` is emitted with the correct
   token shape (from reference-core + reference-lib `extend*` registrations).

2. `packages/reference-app` imports `baseSystem` from `@reference-ui/library` and `ref sync`
   resolves the merged tokens (via `createPandaConfig` merging `extends`).
