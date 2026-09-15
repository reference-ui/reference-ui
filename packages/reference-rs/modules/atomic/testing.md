# testing — how atomic proves anything

The verification layer for `atomic`. This document owns **how we test**;
[SPEC.md](./SPEC.md) owns **what the compiler must do**. If a claim is about
compiler behaviour it is a `ATM-*` case in SPEC. If a claim is about the harness —
what runs, where, how output is validated, what a green run means — it lives here.

Scope rules, fixed:

- **Unit tests only.** Everything runs in-process: `cargo test` for domain logic,
  Vitest across the N-API seam. No browser, no dev server, no network.
- **CSS is validated by a parser, not by a renderer.** Browser-level proof already
  exists one layer up (`test-component`, `test-core` Playwright). Pushing atomic's
  73 stations through a browser would cost seconds each to re-prove something a
  parser answers in under a millisecond.
- **Self-contained.** A station needs its `input/`, a `BaseSystem`, and the
  compiler. Nothing outside `packages/reference-rs`.

---

## 1. Current state

> **Implemented 2026-09-15.** §5 steps 1–6 are landed: goldens are portable,
> `testing/css.ts` holds the validator, `atomicGauges` runs it on every station,
> the quarantine and its self-cleaning meta-test are in place, the golden writer
> refuses invalid CSS, root `test:rs` exists, and `.github/workflows/rust-test.yml`
> runs cargo plus Vitest on `ubuntu-latest`. `pnpm agentrs v atomic` is 80 tests
> green. Step 7 landed (per-station `baseSystem.json` dumps). Step 8
> (token-passthrough policy) remains open by design.
> The table below is the state this document was written against, kept because it
> explains why the work was shaped this way.

The suites existed and were well built. **Nothing ran them.**

| | Reality |
| :--- | :--- |
| Cargo tests | 82, green locally, **not in CI** |
| Vitest stations | 73 under `tests/cases/`, green locally, **not in CI** |
| Package script | `pnpm --filter @reference-ui/rust test` already chains `ensure-native && cargo test --workspace && vitest run` — correct, and unreferenced |
| Vitest projects | `vitest.config.ts` discovers `modules/*/vitest.config.ts`; atomic's project is named `atomic`. Wiring is fine |
| Root scripts | `test:lib` → `agentct`. **No root script runs reference-rs.** |
| CI workflows | `docs.yml`, `security.yml`, `rust-compile.yml`. The last only runs `napi build` |
| Golden portability | 9 `diagnostics.json` goldens embed `/Users/ryn/Developer/reference-ui/…`, so the suite **cannot pass on another checkout** |

So the gap is not test authorship. It is that a green run is currently a local,
manual, unreproducible event on one laptop — and that no assertion anywhere asks
whether the emitted CSS is CSS.

---

## 2. The validation layer

### Choice: `css-tree`

Already in the pnpm store at `3.2.1` as a transitive dep; needs promoting to a
real `devDependency` of `@reference-ui/rust`. It is the right tool because it is
the only one of the three candidates that does **both** halves of the job:

| Candidate | Verdict |
| :--- | :--- |
| **`css-tree`** | **Chosen.** Strict parser with `onParseError`, *plus* an mdn-data-driven lexer (`lexer.matchProperty`) that matches declaration values against each property's formal grammar. Pure JS, no native build. |
| `postcss` | Rejected. Deliberately tolerant — it parses `border: true` and `.2xl\:p_6r` without complaint. A tolerant parser cannot be a validator. |
| `lightningcss` | Rejected for now. Would catch syntax, but it is a native binary, and `chefs_kiss.md` §5 keeps it out of the compiler — having it as the test oracle invites confusion. Reconsider only if we want a Rust-side gauge (§6). |

### Two tiers

**Tier 1 — syntax.** `csstree.parse(sheet, { positions: true, onParseError })`.
Zero errors tolerated. This is what catches malformed selectors.

**Tier 2 — declaration grammar.** Walk every `Declaration` and run
`csstree.lexer.matchProperty(prop, value)`. This is what catches values that
parse but mean nothing.

### The one gotcha: `var()`

`matchProperty` **rejects any value containing `var()`** — it cannot know what a
custom property expands to, so `color: var(--colors-slate-50)` and
`padding: calc(4 * var(--spacing-root))` both come back as errors. Since most of
atomic's output is `var()`-based, a naive tier-2 sweep is almost all noise.

Skipping `var()`-containing values is not a hack, it is spec-correct: per
CSS Variables, a declaration containing `var()` is valid at parse time and cannot
be validated until substitution. Also skip `--*` custom properties, whose value
grammar is `<declaration-value>` — anything.

Optional **tier 3** for later: the sheet contains its own `@layer tokens` block,
so a gauge can build the custom-property table from the sheet itself, substitute,
and then match. That recovers the coverage tier 2 gives up. Not needed to start.

### Cost

Measured over all 73 committed goldens (1,530 KB of CSS): **53 ms total, 0.73 ms
per station** for parse plus full lexer sweep. This is free. There is no argument
for sampling or opting out.

---

## 3. What the validator finds today

Run against the 73 committed goldens with the rules above. This is the reason to
build it, and it is worse than the four known defects.

**Tier 1 — 1 syntax error** (COND-01 `.2xl` closed by NAME-06):

| Station | Error | Cause |
| :--- | :--- | :--- |
| `ATM-SHORT-03` | `Unexpected input` | `border: borders.card` — an unresolved token path emitted as a value |

**Tier 2 — 24 invalid declarations.** That is a count of declaration *nodes*, not
of distinct `prop: value` strings — `ATM-NAME-02` emits `background: n300` twice
(hover and `dark:hover`), so the 24 findings collapse to 23 unique station/value
pairs. They sort into three groups:

1. **The known `Bool`/`Null` defect** (0, closed Move 2): `border: true` no longer
   emits. Owner `ATM-VALID-02`.
2. **Tokens missing from the fixture, emitted raw** (15): `background: n300`,
   `color: n300`, `background: n100`, `n200`, `n900`, `color: primary`,
   `border-radius: full`, `border-radius: md`.
3. **Token-passthrough policy** (3 declarations plus 1 of the 2 syntax errors):
   `margin-top: blue .600` and `background: blue .600` — where `blue.600`
   re-parses as two tokens — plus `border: borders.card`.
4. **Genuinely wrong expansions** (4): `border-color: 0` in both `ATM-LEAF-04`
   and `ATM-LEAF-08`, `box-shadow: 3px solid`, `background-position: 10px auto`.

Groups 2 and 3 are the important discovery: a **fixture bug** and a **policy bug**
that look identical in the output.

The policy bug: SPEC currently *specifies* this output. `ATM-TOKEN-02` says
`mt="blue.600"` emits raw plus a warning; `ATM-SHORT-03` says `borders.card`
"stays single". Both intend a passthrough that turns out to be invalid CSS. A
warning plus a dead declaration is strictly worse than a warning plus no
declaration — the class still lands in the runtime map, so the author gets a
class that silently does nothing. **This needs an architectural decision**, and
it is a SPEC change, not a harness change: when a token cannot be resolved,
should atomic emit the declaration anyway? I would say no — warn and skip, so the
sheet stays valid and the ghost-class gauge catches the now-empty class.

The fixture bug: `n100`/`n200`/`n300`/`n900`/`primary`/`full` are used across
station inputs and have no entry in `BaseSystem::lib_fixture()`, so they pass
through raw. `ReferenceTokenConfig` is an open schema — arbitrary categories and
nesting — so these are perfectly legal token names; they are just not ones
`@reference-ui/lib` authors. The three stations that ship a custom
`baseSystem.json` declare them and correctly print `var(--colors-n100)`.

**The fix is to declare them per station**, giving these stations their own
`baseSystem.json` exactly as `ATM-STATIC-01/02` and `ATM-TOKEN-05` do. That is
the same move recommended in §3 for golden noise, so it fixes both problems at
once: the tokens resolve *and* the golden shrinks from 400+ lines of fixture dump
to a reviewable 15–22.

Because the token schema is open, `base-system` must never hardcode a closed
category list in the dictionary. Lib's own surface is narrower than the
`BAS-TOKEN-05` list suggests: 307 colors, 4 radii, 21 animations, 3 font
families, with `spacing` injected by core and no authored breakpoints at all.

---

## 4. Where it plugs in

Atomic already has the right seam. `testing/runner.ts` runs `standingGauges`
after `spec.verify` for **every** discovered station, and `cases.test.ts` passes
`atomicGauges`. A validator added there is automatically woven into all 73
stations and every future one, with no per-case work.

Put the generic parser wrapper in `packages/reference-rs/testing/css.ts` — that
directory *is* the reference-rs harness (`runner.ts`, `goldens.ts`,
`normalizers.ts`), so it is not "outside atomic" in any meaningful sense, and
other modules that emit CSS get it for free. Atomic-specific policy stays in
`tests/helpers.ts` next to the existing gauges.

```ts
// testing/css.ts — generic, no atomic knowledge
export interface CssProblem { kind: 'syntax' | 'declaration'; message: string }

export function validateCss(sheet: string): CssProblem[]
```

```ts
// tests/helpers.ts — atomic policy, as a standing gauge
export const atomicGauges = [
  cssIsValid,        // ATM-VALID-01 / ATM-VALID-02
  noGhostClasses,    // ATM-GHOST-01 (tightened, see chefs_kiss.md Move 3)
  ...
]
```

### Close the loop at the golden writer

The single most valuable wiring detail: **run validation inside the golden writer,
before it writes.** `--update-goldens` must refuse to bless a stylesheet that
does not validate. Every one of these defects entered the repo through a golden
refresh that nobody semantically reviewed. A validator that only runs on read
lets the next one in the same way.

### Quarantine, so this can land today

Twenty-six findings means the gauge cannot go green on day one, and it should not
be gated behind fixing all of them. Ship it with an explicit, ugly, shrinking
quarantine:

```ts
// tests/css-quarantine.ts
// Known-invalid output. Every entry is a bug with an owner. This list may only shrink.
export const CSS_QUARANTINE: Record<string, readonly string[]> = {
  'ATM-SITE-09': ['border: true'],                          // ATM-VALID-02
  'ATM-SHORT-03': ['Unexpected input', 'border: borders.card'], // see below
  // ...
}
```

Entries match against the problem **message**, so a station that produces both a
syntax error and a bad declaration needs **both**. `ATM-SHORT-03` is the example:
`border: borders.card` trips the lexer *and* the parser, and the parser's message
is `Unexpected input at 410:38`, which does not contain the declaration text. One
entry per station is not enough.

Plus one meta-test: the quarantine must contain no entry that now passes, so
fixing a bug without emptying its slot fails the build. That makes the list
self-cleaning and makes the remaining debt visible in a diff rather than in a
document.

The allowlist cannot live inside the generic writer — `goldens.ts` has no notion
of station IDs. Pass it in as a callback from the suite config, otherwise
`--update-goldens` refuses every quarantined station forever.

---

## 5. Wiring the suites up

Ordered, each independently landable.

1. **Make goldens portable.** `testing/goldens.ts` has a `normalizeText` hook, but
   as originally written it applied only to text goldens on the **read** path, and
   diagnostics are `format: 'json'` — so it could not make these goldens portable
   at all. It needs extending to JSON serialization and to the write path, and it
   needs `StationContext` so it can strip `caseDir`. Then rewrite the 9 goldens.
   Nothing below works before this.
2. **Add a root script** so the package suite is reachable:
   `"test:rs": "pnpm --filter @reference-ui/rust test"`. The package-level script
   is already correct; it just has no caller.
3. **Add CI.** A `rust-test.yml` (or a job in `rust-compile.yml`) on
   `packages/reference-rs/**`: install, `ensure-native`, `cargo test --workspace`,
   `pnpm exec vitest run` from `packages/reference-rs` — bare `vitest run` is not
   on PATH in Actions. Cache cargo the way `rust-compile.yml` already does. Run on
   `ubuntu-latest` only to start — the point is reproducibility, not matrix
   coverage, and step 1 is what makes a non-Darwin runner possible.
4. **Promote `css-tree`** to a `devDependency` of `@reference-ui/rust`. It ships
   no `types` field, so `@types/css-tree` is required, not optional.
5. **Land `validateCss` + the gauge + the quarantine.**
6. **Wire the golden writer** to validate before write.
7. **Fix the fixture** (`n*` palette and friends), which clears most of group 2.
   **Done 2026-09-15.** Nine stations now ship a per-station `baseSystem.json`
   declaring the tokens they actually use (`n100`/`n200`/`n300`/`n900`/`primary`
   as colors; `full`/`md` as radii). Their group-2 quarantine slots are empty;
   `ATM-LEAF-08` still quarantines `border-color: 0`.
8. **Decide the token-passthrough policy** and amend `ATM-TOKEN-02` /
   `ATM-SHORT-03` accordingly.

Note that `pnpm agentrs v atomic` and `pnpm agentrs c atomic` remain the local
entry points — CI should invoke plain `cargo test` / `vitest run` rather than the
agent runner, since the QoS elevation `agentrs` provides is a Darwin-desktop
concern with no meaning on a CI runner.

---

## 6. Deliberately not doing

- **No browser or headless Chrome in atomic.** Higher layers own rendering proof.
- **No `lightningcss` in the compiler** (`chefs_kiss.md` §5). A Rust-side gauge
  using the `lightningcss` crate is a reasonable *future* addition if we want
  `cargo test` to validate CSS too — but the JS gauge covers the seam where the
  goldens actually live, so it comes first and may be enough.
- **No snapshot-only validation.** A golden proves stability, never correctness.
  Every one of the 26 findings above sat inside a passing golden.
- **No stylelint.** It is a style-opinion linter with a config surface we do not
  want; we need a grammar oracle.
- **No fuzzing yet.** Worth having later (`ATM-ORDER-05` idempotence is the
  natural first property), but a validator on 73 real cases buys more today than
  random input on an unvalidated compiler.

---

## 7. What "green" should mean

When this document is fully implemented, a green atomic run means:

1. Every station's emitted stylesheet **parses** as CSS.
2. Every non-`var()` declaration **matches its property's grammar**.
3. Every runtime class has a real selector inside `@layer utilities`, produced by
   the compiler's own namer.
4. Compiling twice, and compiling with inputs reordered, produces byte-identical
   artifacts.
5. It means the same thing on CI as on a laptop.

As of 2026-09-15, **1, 2, and 5 hold** — modulo the 11 remaining quarantined
findings (10 stations), which are tracked, owned, and can only shrink. Group 2
(undeclared tokens) is gone. Items 3 and 4 are SPEC cases
(`ATM-GHOST-01`, `ATM-ORDER-05/06`) that this harness now makes enforceable but
does not yet enforce; they are `chefs_kiss.md` Stage 1 items 5–7.

The honest summary of what changed: a green run used to mean "the compiler printed
something named the way the author wrote it." It now means "and a CSS parser
agrees it is CSS, except in 11 places we have written down."
