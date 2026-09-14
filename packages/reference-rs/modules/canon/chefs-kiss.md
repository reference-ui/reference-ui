# Canon chef's kiss

The dictionary is frozen. SPEC is 1:1. Join is fail-closed. This file is
**structure only**: the generate tree still looks like a drawer of utensils.

Do not change overlay *content*. Do not add SPEC IDs. Do not hand-edit `src/`.
Move jobs until a stranger can name a file from the Rust module it emits.

**Status:** complete.

---

## The slop

Generated and handwritten share a folder. Emitters do not match the crate they
print. DialectData carries the validator's scratch pad. Overlay tables restate
each other.

| Today | Jobs stuffed in |
| :--- | :--- |
| `generate/platform.ts` | `@webref` ingest **and** writing a TS union into the same directory |
| `generate/platform-names.generated.ts` | generated artifact sitting next to ingest |
| `generate/dictionary.ts` | six overlay jobs, plus extension prefixes copied into `SHORT_PREFIXES` |
| `generate/dialect.ts` | join overlay onto platform **and** allowlist Sets for join.ts |
| `generate/emitters/index.ts` | html + dialect + conditions + lib + barrel |
| `generate/emitters/tests/index.ts` | condition stations + join stations + assembler |
| `src/README.md` | handwritten prose inside the generated crate |

`generate/README.md` lists filenames. That is banned. Architecture belongs
there; file headers belong on the files.

---

## Target

One pipeline. Four rooms. Generated never sits in a room that is edited.

```
@webref ──► platform.ts ──► PlatformCss / PlatformElements
                 │
overlay/* ──► dialect.ts ──► DialectData          emit product only
                 │
          join.ts × platform ──► diagnostics      overlay × platform
                 │
            emit/* ──► src/*.rs                   one file per Rust module
```

```
generate/
  generate.ts                 orchestrator: ingest → dialect → join → emit
  platform.ts                 load @webref. nothing else
  webref.d.ts                 ambient listAll() shapes
  overlay/                    typed tables. one job per file
  dialect.ts                  overlay + platform → DialectData
  join.ts                     fail-closed validators
  emit/                       mirrors src/
    format.ts
    html.ts
    dialect.ts
    conditions.ts
    css.ts                    css/mod + properties + longhands + color
    lib.ts
    tests/
      tags.ts
      props.ts
      conditions.ts
      join.ts
      index.ts                concatenates. does not own stations
  generated/
    platform-names.ts         @generated union. only generated TS
src/                          @generated Rust. no handwritten README
tests/join.test.ts            poison + live join stations
```

`emit/` is a mirror of `src/`. If you cannot point at `emit/html.ts` and
`src/html.rs` as the same module, it is not done.

---

## Taste

1. **Generated lives in generated places.** `src/*.rs` and
   `generate/generated/`. Never next to `platform.ts` or `overlay/`.
2. **One job per file.** Ingest does not emit. Overlay does not join. Join
   does not print Rust. An emitter prints one crate module.
3. **DialectData is what emitters consume.** Elements, properties, aliases,
   macros, named conditions, color names. Not `dialectCssAllowlist`,
   `dialectColorAllowlist`, `dialectShortPrefixes`, `dialectAliases`.
4. **Join reads overlay × platform.** Extensions *are* the CSS allowlist.
   `color: true` *is* the color allowlist. `SHORT_PREFIXES` *is* the short
   map. Poison tests clone those tables, not a shadow copy on DialectData.
5. **Overlay tables do not restate each other.** `EXTENSIONS` already has
   `classPrefix`. `SHORT_PREFIXES` is platform shorts + SVG collision
   patches (`d` / `x` / `y`). Drop the duplicate `translateX` / `translateY`
   / `translateZ` / `scrollSnapStrictness` rows from prefixes — same
   prefixes, one owner.
6. **README describes the pipeline.** No filename tables. Completed
   `plan.md` / `plan-pt2.md` / `plan-pt3.md` stay as history.

Emitted Rust tables and lookup signatures stay byte-stable except import
paths inside generate. If `pnpm canon` changes `src/` besides formatting
noise, you changed product. Stop.

---

## Phases

After each phase: `pnpm --filter @reference-ui/rust run canon`,
`pnpm agentrs c canon`, `pnpm agentrs v canon`,
`pnpm agentrs q packages/reference-rs/modules/canon`.

### 1. Isolate generated

Move `platform-names.generated.ts` → `generate/generated/platform-names.ts`.
`platform.ts` loads webref. `generate.ts` writes the union into
`generated/`. Fold `src/README.md` into the crate README. Point overlay
imports at the new path.

**Proof:** `generate/` grep for `platform-names.generated` is empty.
`src/` contains no handwritten markdown.

### 2. Emit mirrors src

Split `emitters/index.ts` into `emit/html.ts`, `emit/dialect.ts`,
`emit/conditions.ts`, `emit/lib.ts`. Move `emitters/css.ts` → `emit/css.ts`.
Move test stations into `emit/tests/{tags,props,conditions,join}.ts`.
`emit/tests/index.ts` only concatenates. Delete the old `emitters/` tree.

**Proof:** every `src/*.rs` has exactly one emitter file. `emit/tests/index.ts`
does not contain `fn can_`.

### 3. Overlay rooms

Replace `dictionary.ts` with `overlay/` — `primitives`, `prefixes`,
`aliases`, `extensions`, `macros`, `conditions`, barrel. Same rows. Same
`satisfies`. Drop restated extension prefixes from `SHORT_PREFIXES`.

**Proof:** `dictionary.ts` is gone. Grep `SHORT_PREFIXES` for `translateX`
is empty; that prefix lives on the `EXTENSIONS` row.

### 4. DialectData shrinks; join stops cloning allowlists

`loadDialect` returns the emit product. Join helpers ask `EXTENSIONS` /
`SHORT_PREFIXES` / platform maps directly (one `isPlatformOrExtension`
predicate, not four copies). Poison in `tests/join.test.ts` mutates the
overlay maps or the emit slices it actually proves — not shadow Sets.

**Proof:** `DialectData` has no `dialectCssAllowlist` /
`dialectColorAllowlist` / `dialectShortPrefixes` / `dialectAliases`.
`cloneDialect` copies emit slices only. 15 vitest stations still pass.

### 5. Honesty pass

```bash
rg -n "emitters/|dictionary.ts|platform-names.generated" packages/reference-rs/modules/canon
rg -n "dialectCssAllowlist|dialectShortPrefixes" packages/reference-rs/modules/canon/generate packages/reference-rs/modules/canon/tests
rg -n "^## " packages/reference-rs/modules/canon/generate/README.md
```

First two: empty (except this file and completed plans). README has no
filename list. `git diff packages/reference-rs/modules/canon/src` is empty
or formatting-only.

Mark this file **Status: complete** only after the four verify commands
pass and the greps are clean.

---

## Out of scope

- Alias / prefix / extension / condition *content* (pt3 freeze).
- New SPEC IDs, new join validators, new lookup APIs.
- Splitting generated `src/css/properties.rs` or `src/tests.rs`.
- Atomic / typegen / styletrace consumers.
- Deleting completed plan files.

---

## Freeze rule

After status is complete:

- A new overlay row still lands in the overlay file for that job, with a
  SPEC ID and a named station, same as pt3.
- A new emitted Rust module gets a matching `emit/` file in the same change.
- Generated TS does not return to `generate/` root.
- DialectData does not grow validator scratch fields.
