# Crew RUNTIME — uncompiled-value runtime/dev behavior (verification only)

Mission: OPERATION CONTINUITY-01. No source edits made; this file is the deliverable.
Tree: branch `reference-system`, clean except untracked `.agents/missions/continuity/` + `DECISIONS.md`.

## 1. The `css()` warn-and-skip path (exact)

Chain for any style prop whose value has no compiled rule:

1. `Div` render splits props and resolves style props through the shared
   `css()` — `packages/reference-rs/modules/primitives/js/factory.ts:51`
   (`css(styleProps, cssProp)`). `maxW` is a known style prop
   (`packages/reference-neo/src/native/generated/primitives/vocabulary.json:1260-1261,2286`,
   alias `maxW → maxWidth`), so it lands in `styleProps`, not element props.
2. `css()` (`packages/reference-neo/src/runtime/css/css.ts:259-278`)
   constructs a class for EVERY well-formed declaration via the runtime namer
   (`name()` → `shape()`, `packages/reference-rs/modules/atomic/js/namer/index.ts:37-43`;
   class is system-qualified `sys__stem`, index.ts:34). Unknown values are
   **constructed, not refused** — proven by
   `packages/reference-neo/src/runtime/css/css.test.ts:103-106`
   (`{color:'nope', bogus:'x'}` → `test__c_nope test__bogus_x`). Refusals
   (empty/non-canonical numerics, `value.ts:167-225`) name no class and get
   no diagnostic (`css.ts:254-257`); nested objects under unknown keys
   likewise name nothing and stay silent (css.test.ts:148-151).
3. `reportStyleMisses` (`css.ts:124-144`) builds one candidate per
   constructed class with this exact message template (`css.ts:133-135`):

   ```
   [reference-ui] css(): no compiled class for `<prop>: <value>` (called at <site>). Add a static call site or staticCss entry; miss class emitted but unbacked, paints nothing.
   ```

   `<prop>: <value>` is `formatMissTarget` (`css.ts:78-81`; value via
   `serializeCanonicalJson`, `plans.ts:36` — strings render JSON-quoted);
   `<site>` is the first non-internal stack frame (`captureMissSite`,
   `css.ts:66-76`, internal-frame filter `css.ts:63-64`). Dedup is
   once-per-distinct-message per session (`reportedMissDiagnostics`,
   `css.ts:42,136-139`).
4. Candidates go to the probe `reportMissCandidates`
   (`packages/reference-rs/modules/atomic/js/namer/miss.ts:31-35`), which
   no-ops without a document (Node silence) and otherwise checks in a
   microtask. `checkCandidates` (`miss.ts:38-53`) scans `@layer utilities`
   selectors across readable sheets and emits the warning at exactly
   **`miss.ts:50`: `console.warn(candidate.message)`** — warn level, not error.

So "warn-and-skip" = miss class emitted on the DOM (unbacked, paints
nothing) + one `console.warn` per distinct miss, dev-browser only.

## 2. What W-04 hooks into

W-04 text: `WANTS.md:54-70` (UNDER REVIEW — loud failure survives only for
genuinely malformed values, not in-between scale values like `140r`).
Implementation seams, per `.agents/missions/sharp/h3.md:155-180`:

- `css.ts` `reportStyleMisses` — message already names prop/value/call-site;
  component-name attribution is best-effort stack parse only (React fiber
  owner lookup flagged optional extra work).
- `miss.ts` `checkCandidates` (`miss.ts:38-53`) / `flushPending`
  (`miss.ts:98-104`) — warn → loud conversion point. MUST reuse
  `sheetsComplete` + `rearmOnLoad` load-gating (naive synchronous throw
  would crash dev apps on values that do compile).
- `reportedMissDiagnostics` once-per-value set (`css.ts:42`) + a cap
  (H-1-style unbounded dynamic values would otherwise fire forever).
- Mechanism: **`console.error`, not throw, not magenta outline**
  (`DECISIONS.md:219-221`). Throw is fatal under any residual race; the
  outline is infeasible from `css()` (returns a class string, can't touch
  the element) unless W-04 injects a rule for the miss class — which is
  option B scoped to a debug declaration (same CSP/SSR caveats, zero paint
  benefit).

## 3. The H-6 race, precisely

Brief: `.agents/missions/playtest/packaging.md:225-236`; crew log (COMPLETE):
`.agents/missions/sharp/h6.md`.

Mechanism:

- `sheetsComplete()` (`miss.ts:60-84`) skips every sheet with `href === null`
  (`miss.ts:70-72`, i.e. all inline `<style>`) and returns false only for an
  empty same-origin LINKED sheet (`miss.ts:80-82`). With zero linked sheets
  it returns **true while the document is still loading**.
- In Vite dev, compiled rules arrive as injected inline `<style>` tags AFTER
  first render; the probe's microtask (`miss.ts:34`) runs between module
  scripts — after the early `css()` call, before the late `<style>` lands.
  The flush scans an empty/half-arrived sheet list and warns for classes
  whose rules EXIST. Observed as 9 false-positive warnings in one smoke run,
  all sheet-verified present, all from one early flush.
- Production is unaffected (render-blocking `<link>` tags gate correctly).

Why anything before load is unsound: pre-`load`, "class absent from
`document.styleSheets`" cannot distinguish a true miss from a rule that
hasn't arrived yet — so a pre-load verdict (especially a throw) blames
compiled values.

Fix status: neo-side hold-until-load is **in the working tree**:
`deliverMissCandidates` + `flushHeldMissCandidates` (`css.ts:92-115`) —
Node (`typeof document === 'undefined'`) and `readyState === 'complete'`
hand off immediately; otherwise candidates queue and flush once on window
`load` (`css.ts:106`). Proven by case `NEO-NAMER-04` (fails unfixed with 2
diagnostics instead of 1, passes fixed; `h6.md:49-56`). Residual gaps per
`h6.md:79-91`: rs-side `sheetsComplete` still treats "no linked sheets
pending" as complete pre-load (non-neo callers unprotected); post-load
HMR-injected styles can still race post-load `css()` calls (MutationObserver
would be the deeper fix); dev warnings now wait for `load` (hang with it on
slow pages — accepted trade-off).

## 4. Runtime fallback (option B): does not exist

Options defined at `DECISIONS.md:208-216`: (B) "it just paints — runtime
injects the compiled-equivalent rule" vs (C) loud dev failure + consumer
`ref sync`. Recommendation 6a is (C) (`DECISIONS.md:225`).

Verified absent today:

- Zero `insertRule` / `adoptedStyleSheets` / `<style>`-creation hits in
  `packages/reference-neo/src/runtime/` and
  `packages/reference-rs/modules/atomic/js/namer/`.
- `css()` returns `string` only (`css.ts:259,277`) — a class string, no
  element or sheet access. The miss class is emitted unbacked by design
  ("paints nothing", `css.ts:135`).
- The blessed paint path for a missing value is consumer-side `ref sync`
  (Toolchain already exists per `h3.md:175-177`), not runtime injection.

## 5. User-visible behavior for `<Div maxW="140r">` today

Assumes `140r` has no compiled rule (scale crew's question) and the app runs
`registerRuntimeData` normally (without it, `css()` throws
`css() called before registerRuntimeData`, `css.ts:260-262`, in all envs).

**Dev (browser, `NODE_ENV !== 'production'`):**

- DOM: `<div class="ref-div 〈system〉__〈stem〉">` where the stem is the
  namer spelling of `maxWidth: "140r"` — deterministic from canonical prop +
  sanitized value, system-qualified per `namer/index.ts:34` (same pattern as
  `test__c_brand` in `css.test.ts:64`; exact prefix comes from the generated
  namer tables). The class matches no rule → **the max-width does not apply;
  layout is silently wrong** (no magenta outline, no throw).
- Console: exactly one `console.warn` (warn level), deferred to microtask
  after `load` (H-6 fix):

  ```
  [reference-ui] css(): no compiled class for `maxW: "140r"` (called at <first non-runtime stack frame, e.g. the Div render call site>). Add a static call site or staticCss entry; miss class emitted but unbacked, paints nothing.
  ```

  Repeats of the identical message stay silent (session set). If `load`
  hangs, the warning waits with it.

**Prod (`NODE_ENV === 'production'`):**

- DOM: identical — unbacked miss class emitted, max-width does not apply.
- Console: **fully silent**. `reportStyleMisses` early-returns
  (`css.ts:125-127`); verified by `css.test.ts:197-202`. No warn, no error,
  no throw. The wrong layout is undetectable at runtime.
