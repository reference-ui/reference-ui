# Doom REPRODUCE verdict: CONTINUITY-01 r-computation

- **Verdict: REPRODUCED**
- **Crew:** doom reproduce (independent of finder; finder scripts never opened)
- **Source artifact:** `.agents/doom/logs/2026-09-27-continuity-r.md`
- **Replay scripts (kept in /tmp, no tree writes):** `/tmp/doom-continuity-r-repro.mjs`, `/tmp/doom-continuity-r-overflow.mjs`
- **Method:** independent replay via `compileSync` from `packages/reference-rs/dist/atomic.mjs`
  with `lib-system-spec.json` fixture as baseSystem; one virtual source authoring
  static `css({ marginTop: '<literal>' })` per literal. (Equivalent entry to the
  finder's live `ref sync` world; same Rust resolver underneath.)

## Evidence (verbatim emitted rules, `@layer utilities`)

| Literal | Emitted declaration |
|---|---|
| `'infr'` | `.mt_infr { margin-top: calc(inf * var(--spacing-root)); }` |
| `'1e309r'` | `.mt_1e309r { margin-top: calc(inf * var(--spacing-root)); }` |
| `'infinityr'` | `.mt_infinityr { margin-top: calc(inf * var(--spacing-root)); }` |
| `'nanr'` | `.mt_nanr { margin-top: calc(NaN * var(--spacing-root)); }` |
| `'1/infr'` | `.mt_1/infr { margin-top: calc(var(--spacing-root) / inf); }` |
| 309-digit / 311-digit overflow | `{ margin-top: calc(inf * var(--spacing-root)); }` |
| `'2r'` (control) | `.mt_2r { margin-top: calc(2 * var(--spacing-root)); }` — survives |

**Diagnostics for every compile: `[]`** (zero errors, zero warnings).

## Notes

- `inf` / `NaN` are Rust `Display` spellings, not valid CSS `<number>` /
  calc-constants (`infinity` would be) — matches the finder's ATM-VALID-02 claim.
- My first 300×`9` literal (≈1e300) is *below* `f64::MAX`, so it minted a
  giant-but-finite `calc(...)` — my literal choice, not a divergence. Genuine
  digit-overflow spellings (309/311 digits, `1e309r`) all mint `calc(inf …)`.
- Mechanism matches the log: bare `str::parse::<f64>()` with no finiteness
  fence (`resolve/rhythm/mod.rs:56-57,65`), printed via `format!` Display.

No fixes attempted — handed to the later crew.
