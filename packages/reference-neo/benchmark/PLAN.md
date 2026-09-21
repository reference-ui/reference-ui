# Neo Bench Plan

Work plan for the next pass on `packages/reference-neo/benchmark`. Execute
this; do not re-litigate it. Bench stays a manual harness (`pnpm bench:neo`),
never a case, never Vitest, never gated. Neo tree only.

---

## 0. Why

The current harness is a flat pile of files and one generator. That generator
emits top-level `export const styleN_M = css({ literal })` and treats
`uniqueRatio` as “draw a fresh 24-bit hex.” Named `enterprise` is a uniqueness
bomb (~44k `css()` calls, ~70k singleton colors), not a large app. Reports are
gitignored, HTML is extra surface, and `hash+dirty` / `-dirty2` folders are a
scratch pad pretending to be a log.

The pass has four jobs, in this order:

1. Folders, so the code can grow without becoming one more slop file.
2. Pin rewrite: dirty → `reports/latest/` (overwrite); clean → `reports/<hash>/`.
   Commit the reports. Drop HTML. Drop `+dirty`.
3. Split generation into templates plus generators, and add a realistic one.
4. Retarget the named scales so `enterprise` means a large messy app, and the
   uniqueness bomb keeps an honest name.

After that, HQ can iterate dirty into `latest`, then commit, then store a
clean-tree pin as the real log.

---

## 1. Decisions (locked)

### 1.1 Reports are the log, and they are in git

- Root stays `packages/reference-neo/benchmark/reports/`.
- Each pin folder contains **only** `result.json` and `report.md`. No
  `report.html`. Delete `dashboard.ts`. Stop printing a dashboard path from
  the CLI.
- Remove the `.gitignore` lines that ignore `benchmark/reports/*`. Reports
  are committed like any other artifact we want a history of.
- Delete the leftover `benchmark/log/` tree (old timestamp scheme). One root.
- Do not commit the existing `*+dirty*` / `*-dirtyN*` / HTML pins. They are
  scratch. The first committed pin is a **clean-tree** run after this pass.

### 1.2 Pin rule (checked at the start of the run)

Dirty classification happens **before** generation and **before** writing
reports. If you check at the end, writing the report dirties the tree and
every run looks dirty.

**Dirty means uncommitted changes outside `packages/reference-neo/benchmark/reports/`.**
Report files must not decide the pin — otherwise leftover `latest/` makes it
impossible to ever land a hash folder.

| Working tree at start (ignoring reports/) | Write to | On collision |
| --- | --- | --- |
| Dirty (product / harness / anything else) | `reports/latest/` | overwrite |
| Clean | `reports/<12-char hash>/` | overwrite that hash |
| Not a git checkout | `reports/latest/` | overwrite |

- No `+dirty`, no `-dirty2`, no `local-<stamp>`.
- A dirty run never writes a hash folder. A clean run never writes `latest/`.
- Hash folders are the log: one folder per commit that was actually measured
  while the tree was clean. Re-running on the same clean commit overwrites
  that commit’s pin (the measurement for that hash, not a second copy).
- `latest/` is the scratch pad for the refine loop. It is **not** gitignored.
  It will show up in `git status` after WIP benches. Do not mix it into a
  “this hash measured X” commit. The loop is:

  1. Change code (tree dirty) → `pnpm bench:neo` → `reports/latest/` overwritten.
  2. Refine until the numbers mean something.
  3. Commit the product / harness change (tree clean, reports/ excluded or
     unchanged).
  4. `pnpm bench:neo` → `reports/<hash>/` written.
  5. Commit that pin. The log grew by one commit.

`revision.ts` becomes this rule. `writeReport` takes the already-resolved pin
(name, hash, dirty). It does not talk to git itself.

### 1.3 Folders for code

Today every module sits in `benchmark/*.ts`. Split by job. Keep a thin
`cli.ts` at `benchmark/cli.ts` so `pnpm bench:neo` (`node …/benchmark/cli.ts`)
does not have to move, unless you also update the root script in the same
pass — either is fine, not both half-done.

Target shape (names can tighten, the seams cannot):

```
benchmark/
  PLAN.md
  README.md
  cli.ts                 # argv, orchestration, prints the readout
  generate/
    rng.ts
    plans.ts             # today’s profiles.ts
    templates/           # one file kind each
    generators/          # how a LoadPlan becomes a repo
  measure/
    worker.ts
    child.ts             # today’s measure.ts spawn + bundle bytes
  report/
    format.ts
    markdown.ts
    write.ts
    pin.ts               # latest vs hash
  reports/
    latest/              # dirty only
    <hash>/              # clean only
```

Gate still applies: 2–6 sentence file headers, no `any`, no suppressions,
file length < 500. `generate.ts` is already the thing that will explode —
do not grow it in place.

### 1.4 Generators and templates

A **template** writes one file kind (tokens, global, config, dead util,
flat style-module, component, recipe). It takes rng + plan (+ index) and
emits bytes. All style values stay **static literals** — extraction does not
follow variables.

A **generator** is a repo assembler: which templates, how many, which
shard layout. A named **scale** picks a generator plus the numeric knobs
(`files`, `deadFiles`, call range, token counts, ratios, seed).

Do not collapse “more files” and “nastier uniqueness” into one axis. That is
how `enterprise` became a hex bomb.

**Keep the current generator**, renamed honestly (suggested: `churn`). It is
a namer / atom-table stress, and it is useful. It is not an app.

**Add a realistic generator** (suggested: `app`). That is what `small` /
`medium` / `enterprise` should run. Physics, not vibes:

- **Reuse, not unique hex.** One-offs are a small pool (a few hundred colors,
  a few dozen spacing values) sampled with a Zipf / power-law. The same
  `#fff`, `16px`, and brand hex must appear thousands of times. `uniqueRatio`
  still means “not a token”; it must not mean “never seen this value before.”
- **Component density, not utility dumps.** Most style files are components
  with 1–4 `css()` (or one recipe use) inside a function body, still as
  literals. Not 8–14 top-level `styleN_M` exports.
- **Dead glob is the majority.** Real `include` walks mostly non-style files.
  Target on the order of 70–90% dead, not 33%.
- **Recipes look like recipes.** Slots (root + 2–3 parts), 3–4 variant axes,
  a couple of compounds. Count can stay in the tens to low hundreds; shape
  is what was missing.
- **Language hardness, lightly.** Nested conditions (`_hover` wrapping
  `_dark`), a wider property list, `base`/`sm`/`md`/`lg` responsive objects —
  still static. Do not invent a second extractor dialect.
- **Tokens stay plausible.** ~80–300 colors, ~30–64 spacing. Semantic names
  beat `c000`. Dark leaves on a few tokens are welcome; a second full palette
  is not required for v1 of `app`.

Suggested scale map after the split (knobs are starting points; lock them in
`plans.ts` and then stop fidgeting):

| scale | generator | intent |
| --- | --- | --- |
| `small` | `app` | tiny product, the bottom of the curve |
| `medium` | `app` | tidy mid-size app (today’s medium file count is fine; drop call density, Zipf the one-offs) |
| `enterprise` | `app` | large messy product: thousands of component files, high dead glob, token leakage with reuse, real-ish recipes |
| `churn` | `churn` | today’s enterprise physics, under its real name |

CLI `--scale` still comma-lists names. Default run is `small,medium,enterprise`
— the app curve. `churn` is opt-in (`--scale churn`) so a routine bench does
not spend six seconds and a gigabyte on a fuzz corpus unless someone asks.

Overrides (`--files`, `--calls`, `--unique`, `--seed`) stay. They still bend
the selected scale; they do not pick a generator.

### 1.5 README and DOMAIN

Rewrite `benchmark/README.md` for the new pin rule, the two generators, and
“reports are committed.” It currently says the opposite (gitignored, HTML
dashboard, `+dirty`).

Add the load-bearing names to `docs/DOMAIN.md` in the same pass: **scale**,
**generator**, **template**, **pin**, **latest**. Bench is Neo-owned
vocabulary now.

---

## 2. Slices

Do them in order. Each slice ends with `pnpm agentneo q` over the bench
paths and a `pnpm bench:neo -- --list` (plus a `--scale small --runs 1`
smoke when generation or pinning changed).

### S1 — Layout

Move the existing modules into the folders in §1.3 without changing
behaviour. `cli.ts` still generates, spawns, measures, writes three report
files for a moment if S2 has not landed yet — or land S1+S2 together if that
is smaller. Do not add features here.

### S2 — Pin, HTML, git

- Pin rule §1.2.
- Stop writing `report.html`; delete `dashboard.ts`.
- Un-ignore `reports/` in the repo `.gitignore`.
- Delete `benchmark/log/` and any existing dirty/HTML pins under `reports/`
  that we do not want in history.
- README pin / report sections.

Smoke: dirty tree → folder is `reports/latest/` and a second run overwrites
it. Stash or commit so the tree is clean (reports/ still ignored by the pin
check) → folder is `reports/<hash>/`. Confirm `git status` shows the new
report files as untracked/modified, not ignored.

### S3 — Template / generator split

Carve `generate.ts` into templates + the current behaviour as generator
`churn`. Scales can still all point at `churn` for this slice so numbers
stay comparable. No new physics yet.

### S4 — `app` generator + retargeted scales

Implement §1.4. Point `small` / `medium` / `enterprise` at `app`. Keep
`churn` as its own scale. Lock knobs in `plans.ts`. README scale list
matches the file. One-offs must collide; if a seeded replay still shows tens
of thousands of singleton hexes, the Zipf pool is wrong — fix that before
calling enterprise realistic.

### S5 — Seed the log

On a **clean** tree, run the default suite once. Commit `reports/<hash>/`
(`result.json` + `report.md` only). That is the first real log entry. Do not
commit `latest/` in that commit unless HQ asks.

---

## 3. Out of scope

- Making bench a case, a Vitest file, or a gate.
- HTML / charts / a second dashboard. Markdown + JSON are the report.
- Changing `sync()`, the compiler, or anything outside `packages/reference-neo`
  except the root `.gitignore` reports lines and the `bench:neo` script path
  if the entry file moves.
- Perfect fidelity to any one company’s monorepo. `app` has to be *shaped*
  like a product (reuse, density, dead glob, recipe anatomy). It does not
  have to reproduce Shopify Admin.
- Dynamic `css()` values, variables, or anything extraction cannot see.
  Realism is distribution and file shape, not a new language.

---

## 4. Done when

- Code lives in the folders in §1.3, not a flat `benchmark/*.ts` slop.
- `pnpm bench:neo` writes `result.json` + `report.md` only.
- Dirty start → overwrites `reports/latest/`. Clean start → `reports/<hash>/`.
  No `+dirty` folders.
- Reports are tracked. `.gitignore` no longer swallows them.
- `enterprise` is the `app` generator. The old uniqueness bomb is `churn`,
  opt-in.
- One-off colors in `app` reuse. A seeded count of distinct hexes is in the
  hundreds to low thousands at enterprise, not ~70k.
- README and `DOMAIN.md` match the harness.
- One clean-tree pin exists under `reports/<hash>/` as the start of the log.
