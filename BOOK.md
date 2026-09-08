# Book

**Status**: Living architecture contract. Documentation only — this file is the roadmap, not an implementation log.  
**Owner**: Book, the component playground for `@reference-ui/lib`.  
**Related**: [`PORTAL_COLOR_MODE.md`](./PORTAL_COLOR_MODE.md) (theme on portaled surfaces inside Book stories), [`packages/reference-lib/src/Book/`](packages/reference-lib/src/Book).

---

## 0. Decision

Book is the playground. It is not the design system.

`@reference-ui/lib` is components, tokens, and public API. Book is the app that discovers `*.book.tsx` stories, renders them, and lets us inspect them. Those two things currently share a folder tree, a Vite entry, leftover Cosmos wiring, and a **second document** (iframe canvas). That mix is why Book feels slow, why it desynchronizes on reload, and why a Book failure is easy to misread as a component bug.

Four commitments:

1. **Stories stay in the library.** `packages/reference-lib/src/components/**/*.book.tsx` is the source of truth. Book discovers them. Components do not move into Book.
2. **The Book runtime becomes its own app** at `packages/reference-lib/book/`. Shell, canvas, decorator, discovery, Vite config, and perf instrumentation live there. They are not published with `@reference-ui/lib`.
3. **One canvas. No iframe mode.** One document, one React tree, one Vite module graph, one Fast Refresh channel. Viewport presets are a sized box in that document, not a nested browsing context.
4. **Reload must feel fast, stay current, and never lie.** A save that updates the open story in place is success. A full remount, a lingering error overlay, or a wiped overlay stack is failure — even if the component under test is correct. If we cannot **measure** HMR, transform, sync, and story-load time, we cannot keep this bar.
5. **Capture and the tweak-component skill sit on top of Book.** They are a Playwright client of Book’s public contract (URL, canvas hook, ready state). They are not a second renderer, not a Cosmos leftover, and they do not keep iframe mode alive “for agents.” Book owes them a stable hook; they owe Book not to spawn `pnpm dev:lib` or invent a private playground.

Cosmos is retired. Capture, agents, and `pnpm dev:lib` already talk to Book on port 5000. The remaining Cosmos files, scripts, patches, and pipeline command are dead weight.

Do **not** publish `@reference-ui/book` yet. Extract a package later only if another package needs the same runtime.

```
packages/reference-lib/
  src/                         published library
    components/**/*.book.tsx  stories (source)
  book/                        playground app (not in tsup)
    app/                       shell + in-tree canvas
    decorator/                 theme / layout boundary
    discovery/                 lazy registry, types
    perf/                      timings, Vite plugin, status
    index.html                 single entry
```

---

## 1. Feel contract

Book is a daily driver. The bar is the same as a well-tuned Vite + Fast Refresh app, not a storybook that “eventually catches up.” There is one performant path. Dual modes are how the current app became slow and desynced.

| Moment | Must feel like | Must not feel like |
| --- | --- | --- |
| First open (`pnpm dev:lib`) | Shell paints quickly; the **open** story loads; other stories stay unloaded | Compiling every story before anything appears |
| Save a component file | The open canvas updates in place in ~100ms when CSS did not change | Blank flash, full reload, lost focus, closed overlay, “Story Rendering Error” that outlives the fix |
| Save a `.book.tsx` | That story swaps in; sidebar labels update if names changed | Every other story remounts |
| Save that needs `ref sync` (tokens / generated CSS) | A visible **Updating** state, then one coherent refresh | Silent stall, half-old CSS, or a red error that looks like the component broke |
| Switch story / theme / viewport | Instant; URL matches what you see | Chrome and canvas naming different stories |
| Story throws | A Book error panel with the stack; **Recovered** as soon as the module updates | Red screen that stays after you fixed the file |
| Capture (`pnpm capture`) | Same origin, `?chrome=0`, wait for `data-book-ready=live`, canvas locator | Cosmos, iframe, or a screenshot of the sidebar / Updating state |

If Book is waiting, buffering, or applying an update, it must **say so**, including **how long the last cycle took**. Silence is how Book currently impersonates a component regression. Unmeasured “it feels slower today” is how regressions sneak back in.

---

## 2. What exists today

Book already runs. `pnpm dev:lib` is:

```
ref sync && concurrently --kill-others-on-fail "ref sync --watch" "vite"
```

Vite serves [`packages/reference-lib/index.html`](packages/reference-lib/index.html) → [`src/main.tsx`](packages/reference-lib/src/main.tsx) → [`BookRoot`](packages/reference-lib/src/Book/BookRoot.tsx) on port 5000.

Book is **not** in the published package. [`tsup.config.ts`](packages/reference-lib/tsup.config.ts) only builds `src/index.ts` and theme. The playground is already a hidden app; it is just sitting in `src/`.

### 2.1 Runtime

| Piece | File | Role |
| --- | --- | --- |
| Root | [`BookRoot.tsx`](packages/reference-lib/src/Book/BookRoot.tsx) | Same entry for shell and a **second** canvas document. `?renderer=true` (or `isolated`) picks renderer. **Both modules are statically imported.** |
| Shell | [`BookShell.tsx`](packages/reference-lib/src/Book/BookShell.tsx) | Nav, search, theme, viewport, Direct/Iframe switch. **Default canvas is iframe.** Direct already exists and is the fast path. |
| Renderer | [`BookRenderer.tsx`](packages/reference-lib/src/Book/BookRenderer.tsx) | Loads the active story, error boundary, overlay wipe, `postMessage` bridge. |
| Decorator | [`decorator.tsx`](packages/reference-lib/src/Book/decorator.tsx) | `ReferenceLibrary` + `colorMode` / `data-panda-theme` / `colorScheme`. Story vs shell layout. |
| Registry | [`registry.ts`](packages/reference-lib/src/Book/registry.ts) | `import.meta.glob(..., { eager: true })` of every `*.book.*` and leftover `*.fixture.*`. |

There is **no** timing surface: no last-HMR ms, no transform breakdown, no split between `ref sync` and Vite, no story-import clock. Slow is anecdotal.

### 2.2 Stories

About 30 `*.book.tsx` files next to components. That placement is correct. The registry still also matches `*.fixture.*` even though those files were renamed.

### 2.3 Cosmos leftovers (not on the running path, still in the repo)

- [`packages/reference-lib/cosmos.config.json`](packages/reference-lib/cosmos.config.json) — Vite plugin, port 5050 renderer URL
- [`src/cosmos.decorator.tsx`](packages/reference-lib/src/cosmos.decorator.tsx)
- [`cosmos/cosmos-shell.css`](packages/reference-lib/cosmos/cosmos-shell.css)
- `cosmos` / `cosmos-export` scripts and `react-cosmos` / `react-cosmos-plugin-vite` deps
- Workspace patches: [`patches/react-cosmos@7.2.0.patch`](patches/react-cosmos@7.2.0.patch), [`patches/react-cosmos-plugin-vite@7.2.0.patch`](patches/react-cosmos-plugin-vite@7.2.0.patch)
- [`pipeline/src/dev/index.ts`](pipeline/src/dev/index.ts) still runs `pnpm run cosmos`
- README / Overview story / some AGENTS.md wording still say Cosmos

Capture already uses Book: `http://127.0.0.1:5000/?book=…&story=…`, then `page.frameLocator('iframe')`. After iframe removal, capture must use the in-page canvas.

---

## 3. Why reload is slow, stale, and untrustworthy

This is a Book + Vite problem. It is not evidence that the component under the cursor is wrong. Several mechanisms stack. Fixing one in isolation will not make Book feel solid.

```
Edit component or *.book.tsx
        │
        ▼
referenceVite.handleHotUpdate returns []
  (every project source module is deferred until sync ready)
        │
        ▼
  wait on ref sync --watch / generated CSS   ← unmeasured
        │
        ▼
  batched ws payload → parent window AND iframe
        │
        ├── shell bumps hmrVersion → rebuilds entry list
        ├── renderer bumps hmrVersion → remounts story via key=
        ├── overlay stack + inert attributes wiped
        └── iframe full-reload (when it happens) uses the FIRST src, not current nav
```

### 3.1 Performance: the module graph is the whole library, twice

[`registry.ts`](packages/reference-lib/src/Book/registry.ts) does:

```ts
const rawModules = import.meta.glob<BookModule>([
  '../components/**/*.{book,fixture}.{ts,tsx,js,jsx}',
  '../*.{book,fixture}.{ts,tsx,js,jsx}',
  '../**/*.book.{ts,tsx,js,jsx}',
], { eager: true })
```

`eager: true` means Vite executes **every** story module at startup and holds every import those stories pull in (the component under test, plus siblings, overlay, focus lock, icons, etc.).

[`BookRoot.tsx`](packages/reference-lib/src/Book/BookRoot.tsx) then statically imports **both** shell and renderer:

```ts
import { BookShell } from './BookShell'
import { BookRenderer } from './BookRenderer'
```

The default canvas is an iframe of `/?renderer=true`. That is a second document hitting the **same** entry. The iframe still parses `BookShell` into its module graph even when it only renders `BookRenderer`.

Consequences:

- Cold start compiles all stories, not the open one.
- HMR invalidation is wide. Touch `Button.tsx` and the eager registry, every importer, and **both documents** are in the blast radius.
- Memory and transform work are roughly doubled (parent + iframe).
- Direct mode is already labeled “instantaneous, fastest HMR” in the UI — then unused as the default. Keeping both modes is the bug. **Delete iframe.** Do not make Direct “default” while leaving a second graph around for capture.

### 3.2 Performance: native Fast Refresh is swallowed, then faked

[`referenceVite`](packages/reference-core/src/vite/plugin.ts) `handleHotUpdate` returns `[]` whenever [`shouldDeferHotUpdate`](packages/reference-core/src/vite/hot-update-policy.ts) is true. That is true for:

1. Managed generated files under `.reference-ui/`
2. **Any project source file that already has Vite modules**

The second category exists so JS does not Fast Refresh before Panda CSS is rewritten. The cost is that **every** save of a component or book file is held until the sync session fires `onRefresh`, then flushed as a custom `update` payload.

Meanwhile `dev` runs `ref sync --watch` next to Vite. A token or primitive change *should* wait. A one-line `console.log` in `Button.tsx` should not feel like a full codegen cycle — but today it shares the same deferral path, and **we do not print either duration**.

On the client, Book does not use Fast Refresh. Both shell and renderer listen to `vite:afterUpdate` and bump `hmrVersion`. The renderer then:

```tsx
<RendererErrorBoundary key={`${entry.id}_${activeStory.name}_${hmrVersion}`}>
```

That is a **hard remount** of the story, decorator, and error boundary on every hot update. It is the opposite of Fast Refresh. It is also slower: React tears down the tree, re-runs effects, re-opens nothing, and loses local state.

### 3.3 Reliability: iframe URL is a snapshot, not the current story

[`BookShell`](packages/reference-lib/src/Book/BookShell.tsx) writes the iframe `src` **once** from the first URL, then navigates only via `__BOOK_NAVIGATE__` / `postMessage`. A Vite `full-reload` inside the iframe resets it to the **first** story of the session while the shell `replaceState` URL has moved on.

That desync is indistinguishable from “my component is broken.” Removing the iframe deletes this class of bug. There is no nested document to drift.

### 3.4 Reliability: HMR is treated as “throw the story away”

On every `hmrVersion` change, the renderer remounts the story, strips `[data-overlay-managed-inert]`, and `overlayStackStore.setState({ layers: [] })`. Appropriate on **story switch**. On HMR it makes a working Overlay / Popover / Menu look like it regressed. Combined with [`PORTAL_COLOR_MODE.md`](./PORTAL_COLOR_MODE.md), this is especially noisy for floating surfaces.

### 3.5 Reliability: errors do not recover unless the fake remount fires

`RendererErrorBoundary` only resets via `key`. If a story throws, you fix the file, and `vite:afterUpdate` is missed, the red panel stays. There is no distinction between “the story threw” and “Book is still applying an update.”

### 3.6 Reliability: two clocks, no status, no numbers

Parent and iframe each have their own HMR listener, React tree, overlay store, and theme effect. Sync-session buffering has **no UI** and **no timer**. The window between “file saved” and “canvas matches disk” is unlabeled. That is the interval where Book feels flaky, and why we cannot tell Vite, Panda, or React apart.

---

## 4. How we improve performance

Each item is a specific change with a reason. Order is the phase list in §9: do the HMR/graph work **before** (or immediately as) the folder move, or the move just relocates the cost.

### 4.1 One document — delete iframe mode

**Today:** iframe is default; Direct is a hidden fast path; capture assumes `iframe`.  
**Target:** remove the switcher, `?renderer=`, `?isolated=`, `?direct=`, `postMessage` / `__BOOK_NAVIGATE__` / `__BOOK_SET_THEME__`, and `BookRoot`’s query-param fork.

The app is:

```
BookDecorator layout="shell"
  sidebar (manifest)
  canvas [data-book-canvas]
    BookDecorator layout="story"
      lazy-loaded active story
```

Viewport (full / 375 / 768 / 1200) is CSS width/height on `[data-book-canvas]`, overflow clipped. Not a nested browsing context.

**Why not keep iframe for capture or CSS sandbox?** Isolation is real, but it costs a second module graph, a second HMR socket, and a URL that can desync. Capture can hide chrome with `?chrome=0` (or screenshot `[data-book-canvas]`) in the **same** document. Portaled overlays already escape a canvas box the same way they escape an iframe; that is a Portal/theme problem ([`PORTAL_COLOR_MODE.md`](./PORTAL_COLOR_MODE.md)), not a reason to keep two Book runtimes.

**Win:** Fast Refresh lands once. Full-reload always matches the parent URL. Transform work is not doubled. The core is one option we can make fast, instead of two options we keep apologizing for.

### 4.2 Lazy story discovery — load the open story, not the catalog

**Today:** eager glob executes every `*.book.tsx`.  
**Target:** Vite `import.meta.glob` **without** `eager: true`.

Split discovery into two layers:

1. **Manifest** (cheap, always loaded): file path, id, title, category, story **names**. Prefer `import.meta.glob` keys plus `export const meta = { title, category }`. Do not execute story components to build the sidebar.
2. **Story loader** (lazy): `modules[path]()` only for the selected book. Cache the loaded module. Measure this import (see §6). Prefetch on sidebar hover is optional later.

Drop the leftover `.fixture.` glob. One pattern: `../src/components/**/*.book.{ts,tsx,js,jsx}` once Book lives in `packages/reference-lib/book/`.

**Win:** cold start and HMR graph scale with the open story, not with the number of components. Adding a new `.book.tsx` must not slow every other story’s refresh.

### 4.3 Trust React Fast Refresh — stop remounting on `vite:afterUpdate`

**Today:** `hmrVersion` on a React `key` is a full remount. Overlay stack is wiped because remount is assumed dirty.

**Target:**

- Remove `hmrVersion` remounts.
- Let `@vitejs/plugin-react` Fast Refresh the changed component / story in place.
- Recompute the **manifest** when a `.book.tsx` is added/removed (Vite glob invalidation), without remounting the open story unless that file is the one that changed.
- Overlay / `inert` cleanup runs on **story identity change** (`bookId` + `storyName`), not on hot update.

**Win:** focus, open overlays, and local story state survive a save. Reload *feels* instant because it is an in-place patch, not a new mount.

### 4.4 Narrow HMR deferral — wait on CSS when CSS changed, not on every keystroke

**Today:** [`shouldDeferHotUpdate`](packages/reference-core/src/vite/hot-update-policy.ts) defers every in-project source module. Correct for generated `.reference-ui` outputs. Too wide for Book.

**Target policy** (Book-aware, still safe for tokens):

| Saved file | Defer until sync ready? | Client behavior |
| --- | --- | --- |
| `.reference-ui/**` generated CSS / runtime | Yes (current) | One coalesced CSS/js update |
| Token / primitive / system source that invalidates generated CSS | Yes | Show **Updating**; apply JS + CSS together |
| Component `.tsx` whose save does **not** dirty generated CSS | No — native Fast Refresh | In-place update |
| `*.book.tsx` | No — native Fast Refresh | Swap story module; keep shell |
| `book/**` chrome | No | Refresh shell; do not remount the canvas unless the story module changed |

Implementation sketch: `referenceVite` keeps buffering managed outputs. For project source, only defer if the sync session has a **pending generation** for that file (or a dirty stylesheet). Book subscribes to a small `BOOK_SYNC` event: `idle | buffering | applying`, with timestamps (see §6).

**Win:** the common loop (tweak component JS/TSX, save) no longer waits on Panda. Token work still cannot flash unstyled/wrong CSS. The status bar shows *which* wait you are in.

### 4.5 Startup and Vite cache

- One `optimizeDeps` graph. `optimizeDeps.exclude` stays aligned with [`referenceVite`](packages/reference-core/src/vite/plugin.ts) (`@reference-ui/react`, `system`, `styled`, `types`).
- `server.warmup.clientFiles` for `book/main.tsx` (or current `src/main.tsx`) plus the **last opened** story path if we persist it — not every `*.book.tsx`.
- Do not `eager` glob in `optimizeDeps.entries` — that would reintroduce “compile everything.”

Optional later: a Book Vite plugin that serves the manifest as a virtual module (`virtual:book-manifest`) so glob keys update when files are added without importing story bodies.

---

## 5. How we improve reliability

One document makes most of the old desync impossible. Remaining rules:

### 5.1 URL is the source of truth

One query string on the only document: `book`, `story`, `theme`, optional `viewport`, optional `chrome=0` for capture, optional `perf=1` for the debug overlay.

`history.replaceState` already exists. After iframe deletion, that URL is also the canvas. A full-reload cannot show a different story than the sidebar.

### 5.2 One navigation state

Shell React state is derived from (or always written to) the URL. No `postMessage` bridge. No `__BOOK_NAVIGATE__`. Story switch is `setState` + URL, then the in-tree canvas reads the same ids and `import()`s that module.

### 5.3 Error boundary recovers on the next good module

- Keep a canvas error boundary around the story only (not the sidebar).
- **Do not** key it on `hmrVersion`.
- Reset when `book`/`story` changes, **or** when `import.meta.hot` reports an update while `hasError`.
- Copy: “This story threw” vs status bar “Updating generated styles…” — never the same chrome.
- After a successful render following an error, the panel is gone. No manual refresh.

### 5.4 Overlay and focus are story-scoped, not HMR-scoped

Move the inert / `overlayStackStore` reset off `hmrVersion`. Reset when `currentBookId` or `currentStoryName` changes. Fast Refresh of `Overlay.tsx` should preserve a locally open dialog unless the component’s own state machine resets — Book must not force that.

If a hot update **does** leave a stuck `inert`, fix that in Overlay/FocusLock, not by nuking the stack on every save.

### 5.5 Visible sync and HMR status (with numbers)

| State | Meaning | User action |
| --- | --- | --- |
| Live · 42ms | Last cycle applied; canvas matches disk | None |
| Updating · sync 800ms | Sync session buffering or applying generated CSS | Wait; do not debug the component yet |
| Story error | Story threw | Fix the story/component; panel clears on next good render |
| Book error | Shell/runtime threw | Book bug, not the component |

Wire this to `referenceVite` / sync `onRefresh` over the Vite websocket so it cannot desync from the actual buffer. Always show the last **sync wait**, **Vite update**, and **story import** durations (see §6).

### 5.6 Stay current

- Lazy loaders must use Vite’s HMR-invalidated `import()` so a saved `.book.tsx` is the new module, not a cached factory from first visit.
- If the open story file is deleted, shell selects a neighbor and the canvas follows via URL.
- Full-reload is allowed; it reloads *this* document from the current URL.

### 5.7 Capture and agents

Capture is a **layer on Book**, not part of the Book runtime. The contract Book owes that layer (URL, `[data-book-canvas]`, ready state) is §7. Implementation of [`capture.mjs`](.agents/skills/tweak-component/scripts/capture.mjs), the tweak-component skill, and [`AGENTS.md`](AGENTS.md) follows that contract; it does not keep an iframe “because Playwright.”

---

## 6. Feedback loops — measure build-time and HMR so “fast” cannot rot

We will not keep the feel contract by intuition. Book needs a **small, always-on instrumentation surface** plus optional deeper tools. The point is a loop: change Book or `referenceVite` → see numbers in the chrome and a local log → next save is faster or we know which clock moved.

Split every cycle into clocks that must not be summed into one mysterious “reload”:

```
file change
  ├─ syncMs          ref sync / Panda / generated CSS (0 if not deferred)
  ├─ viteTransformMs modules transformed for this update
  ├─ viteHmrMs       handleHotUpdate → ws payload sent
  ├─ clientApplyMs   vite:afterUpdate → React commit (Fast Refresh)
  └─ storyImportMs   lazy import() of the active *.book.tsx (story switch or first load)
```

If `syncMs` is 900 and `clientApplyMs` is 20, the component is fine and Panda is the wait. Today those are indistinguishable.

### 6.1 Always on — Book status bar

In the shell header (next to theme), a compact readout, e.g. `Live · 38ms` or `Updating · sync 1.2s`. Click (or `?perf=1`) opens a one-line breakdown: sync / Vite / client / story import / modules invalidated.

This is part of the product, not a hidden `console.log`. If the last HMR exceeded a budget (say **150ms** client apply without sync, or **sync > 1s**), the chip turns warning. That is the “something is wrong with Book, not your Overlay” signal.

### 6.2 Vite plugin — `book/perf` (server)

A local plugin in the Book Vite config (not in published `@reference-ui/lib`):

| Hook | Record |
| --- | --- |
| `configureServer` | Cold start: time from `listen` to first `index.html` |
| `transform` | Duration per module; roll up by prefix (`src/components`, `src/Book` / `book/`, `.reference-ui`) |
| `handleHotUpdate` | File, module count, whether **deferred** (policy), time until flush |
| Sync session | `onRefresh` duration; files in the managed-write buffer |
| `ws.send` | Payload type (`update` vs `full-reload`) — full-reload is a reliability event, count it |

Emit a custom Vite ws event `book:perf` so the status bar does not scrape logs. Also append **JSONL** to `packages/reference-lib/.reference-ui/book-perf.jsonl` (gitignored, next to other generated output). One object per cycle:

```json
{
  "t": "2026-09-08T10:41:00.012Z",
  "file": "src/components/Button.tsx",
  "deferred": false,
  "fullReload": false,
  "modules": 4,
  "syncMs": 0,
  "viteTransformMs": 22,
  "viteHmrMs": 31,
  "clientApplyMs": 18,
  "storyImportMs": null
}
```

A tiny `pnpm book:perf` (or `node book/perf/report.mjs`) prints p50/p95 for the last N minutes and the worst files. That is the feedback loop after a Book change: run the same save three times, compare p95.

Do **not** ship this file. Do not make it a CI gate on day one. First make the numbers visible locally.

### 6.3 Client marks

On story `import()` and on `vite:afterUpdate`:

```ts
performance.mark('book:story-import-start')
await loadStory(id)
performance.mark('book:story-import-end')
performance.measure('book:story-import', 'book:story-import-start', 'book:story-import-end')
```

Post `clientApplyMs` back on the same `book:perf` channel (or `performance.getEntriesByName`). React `useEffect` in the canvas can `performance.measure` first paint of the story after a switch.

### 6.4 Cold start and `book:build`

| Command / moment | What we log |
| --- | --- |
| `pnpm dev:lib` first HTML | `server.warmup` + plugin cold-start ms; count of modules transformed before first story paint |
| Story switch | `storyImportMs` + React commit |
| `pnpm book:build` | Vite `build.reportCompressedSize`; optional `rollup-plugin-visualizer` (devDependency of the Book app, not the library) → `book/dist/stats.html` |
| Module graph | Optional `pnpm book:inspect` wrapping `vite-plugin-inspect` for “why is this file in the graph?” — diagnostic, not required to boot |

Budgets to treat as **warnings in the status bar / report**, not hard CI fails until they stabilize:

| Metric | Soft budget |
| --- | --- |
| HMR, JS-only, no sync | p95 &lt; 150ms save → paint |
| HMR, with sync (token) | show Updating; track `syncMs` separately (no fake 150ms budget) |
| Lazy story import | p95 &lt; 200ms after Vite has compiled it once |
| Cold start to first story | Track and trend; improve via lazy glob + warmup, not a number we invent today |
| `full-reload` count | Zero during a normal component-edit session |

### 6.5 How the loop is used

1. Land Priority 0 (one document, lazy glob, Fast Refresh).
2. Open Book with the status chip visible. Save `Button.tsx` ten times. Note p95.
3. Change Book or `referenceVite`. Repeat. If p95 went up, the change failed even if the UI “looks fine.”
4. If a session feels slow, open `?perf=1` or `pnpm book:perf`: if `syncMs` dominates, do not “optimize React”; if `modules` is 80, the glob is eager again.

This is the opposite of the current failure mode: Book gets slower, we blame components, we add another remount.

Capture is a consumer of the same clocks: it waits for `data-book-ready="live"` and, if that wait is long, prints `syncMs` / “Book is Updating” so an agent timeout is not filed as an Overlay bug (see §7.4).

---

## 7. Capture and the agent skill — a layer on Book

```
*.book.tsx beside components          authoring (library)
        │
        ▼
Book on :5000                        runtime (one document, lazy story, ready state)
        │
        ▼
capture.mjs  (`pnpm capture`)         Playwright client
        │
        ▼
tweak-component skill + AGENTS.md    when/how agents use that client
```

Book does not know about Playwright, Antigravity brain dirs, or markdown tables. Capture does not own a module graph, HMR, or a second canvas. If capture needs a behavior (chrome hidden, story mounted, overlays in the same document), **Book exposes it**; capture consumes it.

That is the whole point of deleting iframe: the agent layer was written against Cosmos’s isolated renderer, then against Book’s iframe. Both made capture a second runtime. After this work, capture is a headed/headless client of the same app you look at in the browser.

### 7.1 What each layer owns

| Layer | Owns | Must not |
| --- | --- | --- |
| `*.book.tsx` | Story exports + `meta` | Know about capture or chrome |
| Book | URL, in-tree canvas, decorator, HMR, `[data-book-ready]`, `?chrome=0` | Start Playwright, write screenshots, parse agent scripts |
| [`capture.mjs`](.agents/skills/tweak-component/scripts/capture.mjs) | Port check, `page.goto`, locators, padded shots, `--states`, `--list` (disk), brain-dir sync, markdown table | Spawn `pnpm dev:lib`, keep `frameLocator('iframe')`, implement a private story runner |
| [`tweak-component/SKILL.md`](.agents/skills/tweak-component/SKILL.md) + [`AGENTS.md`](AGENTS.md) | 5-step loop, “ask the human to run Book”, embed images, no ad-hoc Playwright | Treat Book HMR slowness as a component visual bug |

`--list` can stay **disk-side** in capture (scan `src/components/**/*.book.tsx`, `extractFixtureNames`). That does not require Book to be up. Story **names** must stay aligned with Book’s `normalizeStories` (same default-export / named-export rules). If those parsers drift, agents open a story Book does not have.

### 7.2 Book’s public contract for capture

Stable hooks. Changing these is a Book + capture change in the same PR.

| Hook | Contract |
| --- | --- |
| Origin | `http://127.0.0.1:5000` (already). Capture never starts the server. |
| URL | `/?book=<id>&story=<name>&theme=dark&chrome=0` — `chrome=0` hides sidebar, search, viewport pills, **and the perf chip**. Optional `theme=light`. |
| Canvas | `[data-book-canvas]` wraps the story decorator only. |
| Ready | `[data-book-ready]` on `<html>` or the canvas: `live` \| `updating` \| `error`. Set `live` **after** the lazy story import and first paint, not on `window.load`. |
| Error | `error` plus visible error-panel copy; capture fails the run with that text (do not screenshot the red panel as “the component”). |
| Portals | Same document `document.body`. Capture’s padded screenshot must include portaled overlay/popover/menu (union of canvas + `[data-reference-overlay-portal]`, or full page with chrome off). This is easier than iframe isolation, not a reason to keep iframe. |

Do **not** keep `__BOOK_NAVIGATE__` / `postMessage` as a capture API. URL is enough. `page.goto` with the query is the only navigation capture needs.

Today capture uses `waitUntil: 'load'` plus 150ms. With lazy glob that is a race (sidebar painted, story still importing). The ready attribute replaces the sleep.

### 7.3 `capture.mjs` as the client

Today it assumes a nested document:

```js
const url = `http://127.0.0.1:5000/?book=…&story=…`
await page.goto(url)
const frame = page.frameLocator('iframe')
const root = frame.locator('#root')
```

Target:

```js
const url = `http://127.0.0.1:5000/?book=…&story=…&chrome=0`
await page.goto(url)
await page.locator('[data-book-ready="live"]').waitFor({ timeout: 15_000 })
const root = page.locator('[data-book-canvas]')
```

If ready stays `updating` until timeout, throw something agents can read: `BOOK_UPDATING: waited 15s (sync in progress). Not a component failure.` If ready is `error`, throw `BOOK_STORY_ERROR: …`.

**Script context** (`-e` / `-s` / `captureFixture`):

| Name | Today | Target |
| --- | --- | --- |
| `page` | Playwright page | Unchanged |
| `frame` | `FrameLocator` on `iframe` | **Compat alias** of the canvas locator + `.evaluate` on the page. Same browsing context. Document as deprecated in the skill. |
| `canvas` | — | Primary: `[data-book-canvas]` |
| `root` | `iframe #root` | Same as `canvas` (story root, not the shell `#root`) |
| `target` / `interactive` | Inside iframe | Same heuristics, scoped to `canvas` then page (for portals) |
| `capture` / `pressTab` / `inspectStyles` / `wait` | Unchanged idea | `pressTab` shim inserts into the **page** document |

Keep `frame.locator(...)` working for one cycle so existing agent `-e` snippets do not all break on the same day. The skill and AGENTS.md examples switch to `canvas` / `root`. Then delete `frame` from the context.

Discovery (`--list`, `resolveFixtureFilePath`) stays in capture. When Book moves to `packages/reference-lib/book/`, only glob roots in capture change if stories stay under `src/components` (they should).

### 7.4 Feedback loop through capture

Capture is another probe of Book performance, not a separate dashboard.

- Time `goto` → `data-book-ready=live` as `captureReadyMs` and print it. If it is huge, the agent skill should say Book is slow, not that Button is broken.
- Do not snapshot while `updating`. Do not add a fixed 150ms “hope it’s painted” sleep as the real wait.
- Optional: append a line to the same JSONL (`kind: "capture"`, `book`, `story`, `captureReadyMs`) so `pnpm book:perf` includes agent sessions.

The skill’s baseline capture is only honest if Book is Live. A flake where capture hits a remounting iframe is the current pain; the ready hook is how that flake dies.

### 7.5 Docs the agent actually reads

Same change set as the capture client, or agents will keep writing `frame.locator` against a document that has no iframe:

- [`.agents/skills/tweak-component/SKILL.md`](.agents/skills/tweak-component/SKILL.md) — examples, `--target` copy (“inside the fixture iframe”), `frame.evaluate`
- [`AGENTS.md`](AGENTS.md) §2 — same `frame` examples
- [`packages/reference-lib/AGENTS.md`](packages/reference-lib/AGENTS.md) — Cosmos / port 5050 wording if any remains

Unchanged policies: never background `pnpm dev:lib`; never ad-hoc `node -e` Playwright; `pnpm capture` is the only screenshot path.

---

## 8. Target architecture

```
                    pnpm dev:lib
                           │
                           ▼
              ref sync + ref sync --watch
                           │
                           ▼
                    Vite (port 5000)
                    referenceVite + bookPerfPlugin
                           │
                           ▼
                    /  (single entry)
                    book/main.tsx
                           │
                    BookShell
                      ├── manifest (glob keys)
                      ├── status (Live / Updating + ms)
                      ├── [data-book-ready]            capture waits for live
                      └── [data-book-canvas]            capture / ?chrome=0
                            decorator (story)
                            import() active *.book.tsx
```

### 8.1 Layout on disk

```
packages/reference-lib/book/
  app/
    BookShell.tsx          split later: nav, canvas
    BookCanvas.tsx         story host, error boundary, viewport box, data-book-ready
    book.css
  decorator/
    BookDecorator.tsx
  discovery/
    types.ts
    glob.ts                non-eager glob
    manifest.ts            ids, titles, categories, story names
    loadStory.ts           lazy import + cache + storyImportMs
  perf/
    plugin.ts              Vite transform / HMR / sync timings
    client.ts              marks, status chip, ?perf=1
    report.mjs             p50/p95 from JSONL
  index.html
  main.tsx
  vite.config.ts           moved from package root
```

`packages/reference-lib/src/` loses `Book/`, `main.tsx`, and the Cosmos decorator. Package-root `index.html` / `vite.config.ts` move into `book/`. Scripts:

```
"dev": "ref sync && concurrently --kill-others-on-fail \"ref sync --watch\" \"vite --config book/vite.config.ts\""
"book": "vite --config book/vite.config.ts"
"book:build": "vite build --config book/vite.config.ts"
"book:perf": "node book/perf/report.mjs"
```

(Exact flags can be `root: 'book'` inside the config instead.)

No `renderer.html`. No second entry.

### 8.2 What stays put

- `src/components/**/*.book.tsx` — authoring surface, next to the component.
- Port 5000, `pnpm dev:lib`, capture, agent “please run `pnpm dev:lib`”.
- Decorator as the **only** Book theme/layout boundary (`colorMode`, `data-panda-theme`, `data-color-mode`). No second Cosmos decorator.

### 8.3 Cosmos

Delete the files, deps, patches, and pipeline `cosmos` invocation listed in §2.3. Rewrite Overview copy. Keep `?fixture=` parsing only until capture/docs are Book-only, then delete it.

---

## 9. Phases

Implementation order. **Priority 0 can land in `src/Book` before the move.** Moving first without 0 just copies the bug to `book/`.

### Priority 0 — One canvas + reload solidity (do this first)

1. Delete iframe mode: one tree, `[data-book-canvas]` in the shell, `?chrome=0`, `[data-book-ready]`, no `BookRoot` renderer fork, no postMessage bridge, no Direct/Iframe pill.
2. Lazy glob; sidebar from manifest; load one story; time `storyImportMs`.
3. Remove `hmrVersion` remount and overlay wipe-on-HMR.
4. Error boundary reset on module update / story change.
5. Status: Live / Updating / Story error **with ms**, mirrored onto `data-book-ready`.
6. Book perf plugin + JSONL + status chip (even a first version that only logs to the terminal is enough to start the loop).
7. Narrow `shouldDeferHotUpdate` so JS-only saves Fast Refresh; keep deferral for generated CSS and dirty stylesheets; **record `deferred` and `syncMs`**.
8. Retarget capture in the **same** change: `chrome=0`, wait for `live`, `[data-book-canvas]`, `frame` compat alias, `captureReadyMs`. Update SKILL.md + AGENTS.md examples so agents stop using `frameLocator('iframe')`.

**Exit:** save `Button.tsx` while Overlay is open → Button updates, overlay stays, no red panel, no story jump, status shows a JS-only HMR of tens of ms. Save a token → Updating with `syncMs`, then one coherent paint. `pnpm capture Overlay` waits for Live, snapshots the canvas (not sidebar/perf chip), and still includes portaled surfaces. There is no iframe to desync.

### Step 1 — Move to `packages/reference-lib/book/`

Move runtime, Vite config, HTML, perf plugin. Point package scripts at `book/`. Keep stories in `src/`. Update glob paths. `src/` is library-only.

### Step 2 — Retire Cosmos

Delete config, decorator, css, scripts, deps, patches. Pipeline `dev lib` runs Book. Docs and Overview stop saying Cosmos / 5050.

### Step 3 — Organize for growth

Split the ~570-line `BookShell` into nav and canvas. Keep decorator as the theme boundary. Add `book/vendor/` only if Book hosts third-party probes; do not create an empty folder.

Book may later grow controls, a11y tree, and source. That work belongs under `book/`, not in `src/components`.

### Step 4 — Tooling (the layer)

The runtime contract lands in Priority 0. This step is leftover docs and hermetic pipeline, not a second capture rewrite.

- Skill + AGENTS.md: `canvas` / `root` only; drop `frame` from the script context once no `-e` examples remain.
- Pipeline hermetic lib playground uses `vite` / `book`, not `cosmos`.
- `pnpm book:perf` / `book:build` visualizer as they become useful.

---

## 10. Success

Measurable, not vibes.

| Check | Pass |
| --- | --- |
| Start | `pnpm dev:lib` opens Book on 5000. Sidebar lists stories without executing all of them (one story loaded). |
| One canvas | No iframe, no renderer query, no mode switcher. Viewport is a box. |
| Fast save | Save the open component’s TSX with no token change: canvas updates in place; no full document reload; focus preserved if it was inside the story; status shows HMR ms under the JS-only budget. |
| Token save | Status shows Updating + `syncMs`; CSS and JS apply together. |
| Stay current | Shell label, URL, and canvas always name the same book/story after HMR or full-reload. |
| Errors recover | Throw in a story, fix, save → error panel gone without clicking around. |
| Capture | `pnpm capture Overlay` uses `?chrome=0`, waits for `data-book-ready=live`, shots `[data-book-canvas]` (plus portals), never an iframe or the sidebar. Timeout while Updating is `BOOK_UPDATING`, not a visual regression. |
| Agent skill | SKILL.md / AGENTS.md examples use `canvas`/`root`. Still never starts `pnpm dev:lib`. `--list` still works with Book down. |
| Feedback loop | Status chip + JSONL exist; `pnpm book:perf` can print p95; capture prints `captureReadyMs`. |
| Boundary | `src/` has no Book runtime. Cosmos is gone from scripts, deps, patches, pipeline, README. |
| Publish | `pnpm --filter @reference-ui/lib run build` still does not ship `book/`. |

---

## 11. Out of scope

- New story authoring API (CSF, MDX, controls schema) — keep current `*.book.tsx` exports / `meta`.
- Publishing `@reference-ui/book`.
- Visual redesign of Book chrome beyond status/perf chip and dropping the iframe switcher.
- Changing component public contracts.
- Using Book as a test runner (Playwright matrix stays in `matrix/lib`).
- Hard CI fail on HMR budgets until the local loop is trusted.
- Keeping iframe “just for capture” or “just for CSS sandbox.”

---

## 12. Cosmos → Book URL map

Temporary. Delete this section when nothing reads Cosmos query params.

| Cosmos | Book |
| --- | --- |
| `?fixture={"path":"…/Button.fixture.tsx","name":"Primary"}` | `?book=Button&story=Primary` |
| Playground + renderer on 5000 + 5050 | Single Vite origin on **5000**, one document |
| Isolated Cosmos renderer iframe | **Removed.** Canvas is in-tree. Capture uses `?chrome=0` and/or `[data-book-canvas]` |
| `cosmos.decorator.tsx` | `book/decorator/BookDecorator.tsx` |
