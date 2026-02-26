# reference-test Plan

End-to-end testing for Reference UI **output**. Not the CLI internals—we care that tokens in `ui.config.ts` produce correct CSS in a real app.

See **architecture.md** for the slim structure.

---

## What We Test

**Black box:** User writes tokens → runs `ref sync` → builds app → styles render correctly.

```
ui.config.ts  →  ref sync  →  build  →  browser  →  assert computed styles
```

- Tokens, fonts, keyframes generate correct CSS
- Styles apply at runtime (Playwright)
- Watch mode: change config → rebuild → updated styles (later)

---

## Structure (aligned with architecture)

**tests/** — Core test suite. The assertions. Lives in one place.

**lib/** — Everything tests need: browser automation, runner (commands, dev server, file ops), project generation, assertion helpers.

**environments/** — Bootstraps a project (temp dir, React, bundler), then runs tests with lib loaded into that context. The glue.

---

## MVP Scope

1. Generate minimal Vite + React 18 project in temp dir
2. Add `ui.config.ts` with one token (`colors.brand`)
3. Run `ref sync`, build, start dev server
4. Playwright: assert `color` resolves to expected value
5. Cleanup

One matrix entry. One flow. One assertion. Prove it works.

---

## Pipeline (from plan perspective)

1. **Bootstrap** — environments create project, wire up tests + lib
2. **Define** — ui.config.ts with tokens
3. **Sync** — ref sync, verify styled-system generated
4. **Build** — bundler build succeeds
5. **Render** — Playwright, assert styles
6. *(Later)* **Watch** — modify config, rebuild, re-assert

---

## Matrix (future)

React 18/19 × Vite 5/6 × Webpack etc. Same tests. Different environment bootstrap.
