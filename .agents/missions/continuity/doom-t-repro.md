# CONTINUITY-T REPRODUCE — verdict: REPRODUCED

Date: 2026-09-27. Repro crew (independent of finder; finder artifacts only).

## Blind replay (finder script, unmodified)

`cd packages/reference-rs && ./node_modules/.bin/tsx /tmp/doom-continuity-t1-rvalue.mts` → exit 1:

```
--- @layer tokens ---
{
  :root, [data-color-mode=light] {
    --spacing-4: 1r;
  }
}
--- diagnostics ---
(silent)
--- utility probe ---
  .rvalue-spacing__p_4 { padding: var(--spacing-4); }
RED-FAIL: `--spacing-4: 1r` minted verbatim with zero diagnostics (invalid CSS: `1r` is not a CSS unit).
```

## Independent replay (`/tmp/doom-t-repro-independent.mts`, fresh script, same contract)

Same result under a different system name (`repro-t`):

```
{
  :root, [data-color-mode=light] {
    --spacing-4: 1r;
  }
}
--- diagnostics count: 0
(silent)
  .repro-t__p_4 { padding: var(--spacing-4); }
--- raw mint test: true
```

## Verdict

**REPRODUCED.** Both runs mint `--spacing-4: 1r` verbatim into `@layer tokens`
with zero diagnostics while the static `<Div padding="4" />` utility resolves
to `padding: var(--spacing-4)` — guaranteed-invalid, silently dropped paint,
exactly as claimed.

Minor note: this result shape exposes no `plan` field (`plan: absent/null`),
so the "live plan" clause was not directly observable here; the invalid mint +
silence + healthy-looking utility — the break itself — reproduces exactly.

No fixes, no fortification (later crew).
