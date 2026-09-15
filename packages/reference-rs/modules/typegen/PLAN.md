# Typegen — native cutover plan

Typegen prints deterministic declarations from the same resolved system atomic
compiles. It does not read `ui.config.ts`, evaluate fragments, write files, or
generate browser runtime code.

The pure Rust printer is already 28/28. The cutover work is packet **N5**:
make that printer callable from Core through a thin Node seam without changing
its ownership.

Campaign sequencing: [`../../PLAN.md`](../../PLAN.md).  
Contract: [`SPEC.md`](./SPEC.md).

---

## Required Node contract

Expose:

```ts
emitDtsSync({
  baseSystem: evaluatedSystemSpec,
  strict: ['colors', 'radii'],
}): string
```

Rules:

- `baseSystem` is the same versioned `EvaluatedSystemSpec` atomic accepts.
- the binding lowers it through base-system's single public lowering path
- unsupported schema/unknown fields throw the same class of boundary error
- `strict` is an emit option and never a spec field
- output is returned as text
- Core owns output paths and atomic writes
- asynchronous convenience may wrap the sync call; no worker/fs policy lives
  here

Add:

- a thin native binding registered by the runtime switchboard
- `modules/typegen/js/{runtime,index,types}.ts` or the repository-equivalent
  small wrapper split
- `@reference-ui/rust/typegen` package export
- generated declaration entrypoint for that export

Do not point `@reference-ui/rust/system` at atomic and pretend typegen is
wired. Core must import a named, tested typegen seam.

---

## Declaration ownership

Typegen owns generated system ingredients:

- token category unions and `Tokens`
- `FontRegistry` and font-name/weight relationships
- named condition keys
- recipe variant/compound declarations
- its SPEC `StyleProps`/`SystemStyleObject` output

Core owns the public Reference UI assembly:

- the full CSS property universe from `csstype`
- Reference aliases and primitive-specific omissions/additions
- `StylePropValue`
- public `StyleProps`
- the single public `SystemStyleObject`

Core consumes native token/condition/font declarations as ingredients.
Recipe variant types for application `recipe()` calls come from Core
`RecipeDefinition` inference. Typegen prints recipe unions only when
`spec.recipes` is non-empty; Core does not import those names. Typegen must
not grow Panda's jsx/pattern/recipe-module farm to satisfy Core.

Empty token categories still emit the named aliases Core imports (`never`).
`FontRegistry` is always emitted, including `{}`. `StyleConditionKey` and the
style/condition surface are always emitted for `profile: 'reference-ui'`.

The generated package may keep a local `csstype.d.ts` copy so declarations
resolve under pnpm's strict layout. That packaging decision belongs to Core;
typegen does not perform filesystem copying.

---

## N5 implementation steps

### TYP-NATIVE-01 — shared spec boundary

1. Depend on base-system's public evaluated-spec lowering API.
2. Add positive and negative tests using root packet F0 fixtures.
3. Ensure atomic and typegen accept identical JSON, including profile,
   structured globals, and schema version.
4. Do not add a second `BaseSystemInput` TypeScript shape.

### TYP-NATIVE-02 — N-API function

1. Add the minimal binding call.
2. Deserialize input/options.
3. Lower to `ResolvedBaseSystem`.
4. Call `emit_dts_with`.
5. Return text or a descriptive error.
6. Register the module in runtime's native switchboard and Cargo dependencies.

The switchboard remains glue. Do not move printer logic into it.

### TYP-NATIVE-03 — JS/package seam

1. Add typed sync/async wrappers.
2. Add `typegen` to tsup entrypoints and package exports.
3. Ensure generated `.d.ts` entrypoints include the new API.
4. Add a JS seam test that loads the real native addon.
5. Assert no filesystem writes and no Panda imports.

### TYP-NATIVE-04 — Core fixture readiness

The returned declaration for the shared lib-shaped fixture must contain:

- representative color, spacing, radius, font, and condition names
- stable empty aliases when a category is absent (token-light F0 fixture)
- recipe identities/variant axes only when the fixture declares recipes
- strict wrappers only when requested
- deterministic byte equality across repeated calls

If the existing printer omits a required ingredient, add one SPEC case before
changing it. Do not make an untracked host-only printer fork.

---

## Verification

During implementation:

```bash
pnpm agentrs c typegen -t "<case>"
pnpm agentrs v typegen -t "<case>"
pnpm agentrs q packages/reference-rs/modules/typegen
```

Before hand-off:

```bash
pnpm agentrs c typegen
pnpm agentrs v typegen
pnpm agentrs v runtime
pnpm agentrs q packages/reference-rs/modules/typegen
```

Golden updates are deliberate:

```bash
TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen
```

Review each changed declaration before accepting it.

Done means:

- `@reference-ui/rust/typegen` imports and executes
- positive v1 fixture emits deterministic declarations
- wrong version/shape fails
- open and strict calls differ only as specified
- printer remains complete or has explicit new SPEC cases for stable empty
  aliases and optional recipes
- output has no `@pandacss`, generated jsx factory, pattern implementation, or
  executable recipe/runtime code

---

## Core hand-off

Packet C3 receives:

1. exact import path/function name
2. generated TypeScript request type
3. shared positive/negative fixtures
4. example open and strict output
5. proof commands/results
6. any SPEC change made because repository evidence contradicted the printer

Core C3, not this agent, removes Panda type imports and writes
`.reference-ui/styled/types`.

---

## Do not

- Do not parse config files.
- Do not write the filesystem.
- Do not generate `styled.div`, jsx, patterns, `css.js`, or per-recipe modules.
- Do not add Panda compatibility aliases.
- Do not duplicate base-system spec types.
- Do not make typegen depend on atomic output or atom/class names.
- Do not replace Core's owned public `SystemStyleObject`.
- Do not refresh goldens merely because a test failed.
- Do not add `#[allow(clippy::…)]` or `#[expect(clippy::…)]`.
