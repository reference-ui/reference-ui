# Combobox decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: scalar coordinator keeping focus in-field over a virtual list.

## Landed (context, 2-4 lines)

Quarantine-landing ported 9 stability wins (mounted-only IDs, rest-first
spread, IME guard, additive ARIA, dev diagnostics, Escape revert, native
Home/End/PageUp/PageDown, readonly/disabled guards, mounted-only commit)
and a 41-unit + 25-CT suite with visuals frozen (6 snapshots
byte-unmodified, 1 new human-gated baseline). Log:
`.agents/missions/quarantine-landing/combobox.md`. Landing commit:
`02b6e12b1`.

## Candidate features (quarantine-sourced)

### 1. `autocomplete` modes (`none` | `list` | `both`) — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`,
  `packages/reference-lib/src/components/Combobox/Combobox.tsx`
  (inline-completion effect, `aria-autocomplete` plumbing) +
  `combobox-context.ts` (`ComboboxAutocomplete`); cases `CB-MODE-01`
  through `CB-MODE-07`, `CB-DOM-02`.
- **API sketch:** root `autocomplete?: "none" | "list" | "both"`
  (default `"list"`); `both` displays the active option's label as inline
  completion with only the suggested suffix selected, restores the typed
  prefix when active clears, and never emits `onInputValueChange` for
  preview navigation; `aria-autocomplete` tracks the prop synchronously.
- **Why not landed:** feature-needs-design — inline-completion caret/suffix
  machinery (prefix tracking, suffix selection, mode-switch clearing) is a
  new behavior surface, not a stability win. Landed code pins default
  `list` behavior (`aria-autocomplete="list"`, `CB-MODE-02` partial).
- **Revisit when:** freeze gate 5 (`autocomplete` matrix) is scheduled and
  a `both`-mode consumer exists to prove suffix editing against.
- **Open questions:** should `both` completion participate in IME
  composition, or is composition always prefix-only? What announces the
  completion to screen readers — suffix selection alone, or an
  `announce()` call?

### 2. `allowCustomValue` + custom-value commit semantics — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `Combobox.tsx` blur/Enter paths +
  `combobox-context.ts` (`allowCustomValue`, `lastCommittedText`); cases
  `CB-CUSTOM-01`, `CB-CUSTOM-02`, `CB-COMMIT-02`, `CB-COMMIT-05`,
  `CB-COMMIT-07`.
- **API sketch:** root `allowCustomValue?: boolean` (default `false`).
  `true`: Enter/blur on unmatched text commits the exact string via
  `onChange`, empty text maps to `null`. `false`: unmatched Enter/Tab
  reverts the input to the last committed text with no value callback.
- **Why not landed:** feature-needs-design — every commit/revert path
  (Enter, Tab, blur, Escape) branches on this policy, and the landed
  prototype currently commits the active option even when the text is
  unmatched (SPEC-documented gap). Porting one branch without the policy
  would bake in half-semantics.
- **Revisit when:** HQ approves the custom-value decision table (Enter /
  Tab / blur / Escape × matched / unmatched × allowed / disallowed), or a
  free-text consumer (tag entry, new-item creation) needs it.
- **Open questions:** does `true` normalize whitespace (`trim`) before
  commit, or commit the exact string (quarantine trimmed only on blur)?
  Does Tab commit custom text or only Enter/blur?

### 3. `closeOnBlur` + blur policy — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `Combobox.tsx` `handleBlur`
  (relatedTarget containment check) + `combobox-context.ts`
  (`closeOnBlur`); cases `CB-REVERT-03`, `CB-REVERT-07`, `CB-DOM-10`.
- **API sketch:** root `closeOnBlur?: boolean` (default `true`). `false`:
  blur alone requests neither revert nor dismissal; Escape and explicit
  layer dismissal still run their documented sequences. `true`: blur
  commits an allowed custom value or restores committed text, then
  dismisses.
- **Why not landed:** feature-needs-design — the naive port (close on any
  blur) breaks pointer commit, and the correct version needs the
  relatedTarget/popover-containment machinery plus the custom-value policy
  from §2 to decide commit-vs-revert on blur.
- **Revisit when:** §2 lands (blur must know commit-vs-revert), or a
  `closeOnBlur={false}` consumer (palette-style persistent popup) appears.
- **Open questions:** with `closeOnBlur={false}`, does focus returning to
  the input re-announce the open popup? Does Tab (focus traversal) still
  dismiss while plain blur does not?

### 4. `loading` → `aria-busy` + `announce()` empty/no-results — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `Combobox.tsx` (`aria-busy` on the
  listbox, `announce('No results')` on empty) + `combobox-context.ts`
  (`loading`); no dedicated case IDs — SPEC.md Surface "Async" row is the
  contract (`loading?` → listbox `aria-busy`; empty / "no results" spoken
  via `announce()`, no private live region).
- **API sketch:** root `loading?: boolean`. `true` sets `aria-busy` on the
  listbox; empty and "no results" states route their message through the
  shared `announce()` (Announcer-owned), never a Combobox-private live
  region.
- **Why not landed:** feature-needs-design — the async contract (who
  decides "empty" vs "loading" vs "no results", exact message prose, busy
  timing) was never specified beyond the Surface row, and no async
  consumer exists in-dir to prove it against.
- **Revisit when:** freeze gate 6 (async contract) is scheduled, or the
  first async-filtering consumer needs busy/empty announcements.
- **Open questions:** what are the exact empty vs no-results strings (or
  are they application props)? Does `loading` suppress the content gate
  in §10 while results are in flight?

### 5. `virtualFocus` grid adapter + `VirtualItem` + scroll timing — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `combobox-context.ts`
  (`ComboboxGridAdapter`, `VirtualFocusNavigationRequest`,
  `getVirtualItem`, `pendingVirtualTarget`) + `Combobox.tsx`
  (VirtualItem slotting, `scrollToIndex` calls); cases `CB-VIRT-01`,
  `CB-VIRT-02`, `CB-VIRT-03`, `CB-ADAPTER-01`, `CB-ADAPTER-04`,
  `CB-ADAPTER-05`, `CB-ADAPTER-06`, `CB-ADAPTER-07`, `CB-ADAPTER-08`,
  `LB-CB-02` (windowed handoff), `CB-COMP-01`.
- **API sketch:** `Combobox.Popover virtualFocus={gridAdapter}` where the
  adapter supplies complete logical order, `getNextIndex({key,
  currentIndex, direction})` grid topology, and `scrollToIndex`;
  `Combobox.VirtualItem index={n}` slots stable value-derived IDs, state,
  refs, and events onto one native child with no wrapper; Combobox calls
  `scrollToIndex` once for unmounted targets and publishes
  `aria-activedescendant` only after mount; stale requests cancel on
  metadata change; exactly one collection authority or a diagnostic.
- **Why not landed:** feature-needs-design plus cross-crew — the largest
  quarantine subsystem (registry, mount-timing, stale-cancel, diagnostics)
  with zero windowed consumers in-dir; `LB-CB-02` (windowed Listbox proof)
  is blocked on it from the Listbox side too.
- **Revisit when:** freeze gate 7 (`virtualFocus` + Tree) is scheduled, or
  a 100+-item windowed consumer forces the mount-timing contract.
- **Open questions:** is `scrollToIndex` owned by the application
  virtualizer (adapter passes it through) or provided by Reference UI?
  What is the pending-target UX while a scroll is in flight — old ID held,
  or ID omitted?

### 6. Tree bridge (nested Tree popup) — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `combobox-context.ts`
  (`collectionType: 'listbox' | 'tree' | 'grid'`) + `Combobox.tsx`
  (tree-typed collection handling); cases `CB-TREE-01`, `TR-CB-01`
  through `TR-CB-06`, `CB-COMP-03` (CommandPalette gate).
- **API sketch:** no new Combobox props — Listbox and Tree "automatically
  expose their collection registries when nested in Combobox" (Combobox.md
  contract); Combobox navigates only visible Tree items, delegates
  horizontal expansion keys to Tree, keeps input focus, and exposes
  matching `aria-haspopup="tree"`.
- **Why not landed:** cross-crew — the RovingFocus "CB bridge" handoff
  never materialized (RF log COMPLETE with no such item) and the Tree crew
  is still IN PROGRESS; there is no registry contract to build against yet.
- **Revisit when:** Tree lands its collection registry and publishes the
  bridge shape, then `CB-COMP-03` (palette with interchangeable Tree/grid
  adapters) becomes provable.
- **Open questions:** does Tree expansion state live in Tree (one
  controlled expansion request per TESTS.md) with Combobox purely
  delegating keys — or does Combobox track expanded branches? Who owns
  typeahead across collapsed branches?

### 7. `onEscape` granular cancelable API — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `Combobox.tsx` (cancelable Escape
  event construction) + `combobox-context.ts` (`onEscape?`); case
  `CB-REVERT-02`.
- **API sketch:** root `onEscape?: (event: CancelableEscapeEvent) =>
  void`, fired before revert/dismiss; `preventDefault()` stops text
  revert, value callbacks, and high-level dismissal while `open` and
  active-descendant DOM stay controlled.
- **Why not landed:** feature-needs-design — a cancelable-request API is
  new public surface, and its shape (event type, granularity, ordering vs
  Overlay's document-level dismiss listener) must be designed once across
  Overlay/Popover/Combobox, not invented per component.
- **Revisit when:** the granular-dismiss design covering Overlay +
  Popover + Combobox is written; Escape-during-IME already needed the
  stopPropagation half (landed per `CB-EDIT-05/09`).
- **Open questions:** is the event a real `KeyboardEvent` or a synthetic
  `{key: 'Escape', cancelable}` (quarantine built the latter)? Can
  `onEscape` distinguish "revert text but stay open" from "do nothing"?

### 8. Select-only Trigger keyboard handling — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `Combobox.tsx` Trigger keydown
  (arrows open/navigate, printable typeahead buffer with timeout);
  cases `CB-SELECT-02`, `CB-SELECT-03`, `CB-SELECT-08`.
- **API sketch:** no new props — closed Trigger opens on ArrowDown/ArrowUp
  (first/last enabled target by direction), printable keys typeahead-cycle
  enabled matches with buffer timeout, Home/End jump to first/last
  enabled option; Trigger keeps DOM focus throughout; nothing commits
  until activation.
- **Why not landed:** feature-needs-design — needs the typeahead buffer
  machinery plus `activeSource` (§9) to keep preview-vs-commit straight;
  landed Trigger is mouse + native Enter/Space toggle only (SPEC gap,
  `CB-SELECT-04` partial).
- **Revisit when:** §9 (`activeSource`) lands, or a select-only keyboard
  consumer requires parity with the editable arrow matrix.
- **Open questions:** what is the typeahead buffer timeout (Downshift
  parity value)? Does typeahead match against `textValue`, visible label,
  or both? Do PageUp/PageDown work on Trigger (TESTS.md is silent)?

### 9. `activeSource` (keyboard/pointer) + leave-clears + Tab eligibility — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `combobox-context.ts`
  (`setActiveValue(val, source?)`, `activeSource`); cases `CB-NAV-05`
  (leave clears pointer-derived state), `CB-COMMIT-04` (Tab commits only
  keyboard-derived active), `CB-COMMIT-07` (no Tab commit after
  pointer-leave clears).
- **API sketch:** internal (possibly exposed for styling): every active
  value carries its source; leaving the popover clears only
  pointer-derived active state (keyboard-derived survives); Tab commits
  only keyboard-derived active, never a stale pointer preview.
- **Why not landed:** cross-crew + needs-design — pointer-leave clearing
  is Listbox-owned (`handleMouseLeave`, Listbox crew COMPLETE without
  it), and the landed context deliberately kept Listbox-compatible 1-arg
  `setActiveValue(v)` (crew log handoff note). Landed behavior resets
  active to the selected value on leave instead of clearing.
- **Revisit when:** Listbox exposes pointer-leave clearing (or a
  leave-event Combobox can subscribe to), and Tab-commit eligibility (§2
  spillover) is specified.
- **Open questions:** is `activeSource` public API (render-prop, data
  attribute) or purely internal commit gating? Does keyboard nav after
  hover overwrite the source, or do both coexist until leave?

### 10. `CB-OPEN-03` content gate (edit opens only with content) — verdict: DEFERRED

- **Source:** quarantine `c6fae977a`, `Combobox.tsx`
  (`hasPopulatedContent()` gating edit-triggered `requestOpen`); case
  `CB-OPEN-03`.
- **API sketch:** no new props — typing into a closed Input requests
  `onOpen` only when popover collection content exists (a Popover is
  authored and its logical collection is non-empty); empty coordinators
  emit `onInputValueChange` alone, with no open spam while the parent
  stays closed.
- **Why not landed:** incompatible with Overlay unmount-when-closed as
  written — "content exists" cannot be observed when the closed popover
  is unmounted, so the gate needs an Overlay content-presence contract
  (or a mounted-but-hidden query path) designed first.
- **Revisit when:** Overlay defines how a closed coordinator observes
  would-be content (registry? metadata without mount?).
- **Open questions:** does "content exists" mean authored-Popover-present,
  logically-non-empty, or both (TESTS.md says both)? Does the gate apply
  to programmatic `inputValue` changes or only real user edits?

### 11. Multiple selection / token chips — verdict: DECLINED

- **Source:** quarantine `c6fae977a` (the `CB-ADAPTER-03` incompatibility
  diagnostic: scalar `onChange` rejects `selection="multiple"` Listbox);
  case `CB-ADAPTER-03`.
- **API sketch (rejected):** none in Combobox — multi-select stays the
  documented Field + application-Buttons composition (`FI-COMP-04` token
  picker, landed and proven this arc); Combobox commits one scalar value.
- **Why not landed:** single-value freeze is the product decision
  (Combobox.md "Combobox stays scalar", SPEC.md "Won't do",
  TESTS.md "Out of scope"); quarantine itself only specified the
  rejection diagnostic, never multi behavior.
- **Revisit when:** a named later gate re-opens multi-select as its own
  primitive — never as silent scope creep inside this kernel.
- **Open questions:** none — killer reason: scalar commit is the freeze;
  chips are Field-owned chrome, proven by `FI-COMP-04`.

## Suspected gaps (no quarantine source)

### 1. Focus opens the popup (fights deliberate open) — verdict: DEFERRED

- **Evidence:** landed `Combobox.tsx` `handleFocus` opens on every focus;
  SPEC.md "Gaps & incoherence" ("Focus opens the popup — fights
  deliberate open / closeOnBlur"). Corroboration (not source):
  quarantine's `handleFocus` explicitly refused focus-open per the APG
  invariant but shipped no case ID for it.
- **API sketch:** remove focus-open (and click-open on the Input is
  already gated to closed→open request; keep that); opening comes only
  from arrows, real edits (§10 gate), and explicit Trigger activation.
- **Why not landed:** behavior change is outside mission law (landing
  preserves current behavior); several landed tests pin current open
  paths and would need re-targeting.
- **Revisit when:** §3 (`closeOnBlur`) or §10 (content gate) lands —
  focus-open must die in the same gate that defines deliberate open, or
  the two will contradict.
- **Open questions:** does autofocusing a Combobox on page load open it
  (current yes)? HQ should try: focus the Searchable Book story's input
  and watch the popup open uninvited.

### 2. Touch outside-dismiss without compat-mouse replay — verdict: OPEN

- **Evidence:** TESTS.md `CB-CLOSE-05` (Downshift body-`touchend`
  regression: one modality-correct dismiss, no later compatibility
  `mousedown`/click replay). Quarantine's e2e title for it was vacuous
  (crew log: "will not enshrine").
- **API sketch:** no new props — a real touch sequence ending outside
  produces one blur/revert-or-commit + dismissal path; internal touches
  stay inside; no second request from the emulated mouse events.
- **Why not landed:** no quarantine source to port (vacuous title only)
  and no touch harness in the landed suite (CT is mouse/keyboard).
- **Revisit when:** a touch-device CT harness exists, or the first mobile
  consumer reports double-dismiss.
- **Open questions:** does touch outside commit custom text (§2) or revert
  — i.e. is touch-outside a blur (§3) or its own path? What does touch on
  popover chrome (non-option) do — nothing, or dismiss?

### 3. ShadowRoot contract + cross-engine parity — verdict: OPEN

- **Evidence:** TESTS.md `CB-ENV-03` (shadow: focus discovery, composed
  paths, active IDs, virtual scroll in the owning root) and `CB-ENV-04`
  (identical behavior in Chromium/Firefox/WebKit). Quarantine's e2e
  titles for both were vacuous (crew log).
- **API sketch:** no new props — documented portal destination (focus
  source's containing open ShadowRoot), composed inside/outside paths,
  same callback order across engines allowing only documented native text
  differences.
- **Why not landed:** no portable source (vacuous titles) and the landed
  suite runs Chromium-only CT plus jsdom unit; shadow/cross-engine needs
  harness, not just code.
- **Revisit when:** the matrix CT harness covers ShadowRoot fixtures and
  Firefox/WebKit runs for lib components.
- **Open questions:** is ShadowRoot a supported deployment target for the
  freeze, or a hardening gate after 1.0? Which engine differences count
  as "documented native text differences" vs bugs?

### 4. Single layer + single dismissal sequence (CLOSE-03) — verdict: OPEN

- **Evidence:** TESTS.md `CB-CLOSE-03` (one layer entry,
  granular-before-high-level dismissal exactly once, one positioned
  popover, no duplicate runtime). Quarantine's e2e title was vacuous
  (crew log).
- **API sketch:** no new props — Escape/outside-press on one popover
  yields exactly one layer registration and one granular→high-level
  dismissal sequence, shared with Popover positioning (no
  double-registered event).
- **Why not landed:** needs Overlay co-design (layer accounting is
  Overlay-owned; Objective B verified NO-OP this arc) and had no portable
  source.
- **Revisit when:** Overlay opens its layer/dismissal accounting for
  audit, or a double-dismiss bug is reported against Combobox-in-Overlay.
- **Open questions:** who logs the layer — Combobox's wrapped Content or
  the parent Overlay (or both, as branch)? Is granular-before-high-level
  ordering asserted per modality (Escape vs outside press vs blur)?

### 5. Select-only commit/revert mirror without text callbacks — verdict: DEFERRED

- **Evidence:** TESTS.md `CB-SELECT-05` (Escape/Tab/Shift+Tab/blur on
  select-only: documented commit-or-no-commit, one close, native focus,
  cleared active ID, zero `onInputValueChange`).
- **API sketch:** no new props — select-only mirrors the editable
  commit/revert matrix minus every text callback; quarantine never
  implemented the mirror (its Trigger work stopped at open/navigate in
  §8).
- **Why not landed:** follows from §8 (Trigger keys) + §2/§3 (commit/blur
  policy); specifying the mirror before the editable policy exists would
  freeze guesses.
- **Revisit when:** §§2–3 land, as the select-only conformance half of
  that gate.
- **Open questions:** does Escape on open select-only revert anything (no
  text — so just dismiss)? Does Tab on select-only with keyboard-active
  option commit (§9 eligibility) while blur-outside does not?

## Non-decisions (rejected outright)

- Controlled-only rewrite (deleting `defaultOpen` / `defaultValue` /
  `defaultInputValue`) — mangling-class; rejection in crew log
  ("Deliberately NOT ported") + SPEC.md "Gaps & incoherence" (uncontrolled
  kept deliberately, pinned by an API freeze test).
- Book/tests re-targeted to `open` + `onOpen`/`onDismiss` only —
  same rewrite's test half; rejected crew log + SPEC.md Status.
- Enshrining vacuous quarantine e2e titles (`CB-CLOSE-03/05`,
  `CB-ENV-03/04`, `CB-COMP-01/02/03/04` as-written assert nothing) —
  rejected crew log ("will not enshrine").
- Filtering/ranking helpers, cmdk score/filter — scope leave, not
  Combobox API; Combobox.md "Leave" + TESTS.md "Out of scope".
- Downshift render props, Zag positioning/dismiss runtime, cmdk Dialog
  wrap — vendor leaves; Combobox.md "Leave" + SPEC.md Vendor.

## Walkthrough notes for HQ

- Most important 1/3: **`allowCustomValue` (§2)** — it decides every
  commit/revert path (Enter, Tab, blur, Escape × matched/unmatched), and
  the landed prototype currently commits the active option even for
  unmatched text. Try in Book: Searchable story, type "zzz", press Enter
  — today it commits highlighted React; the freeze must define revert.
- Most important 2/3: **`autocomplete="both"` (§1)** — inline completion
  is the flagship UX gap (suffix selection, prefix restore); everything
  else in the backlog is reachable without it, but no consumer can ship
  "both" until HQ answers the IME + announcement questions.
- Most important 3/3: **`virtualFocus` + Tree bridge (§§5–6)** — the
  scale story (windowed 100+ lists) and the palette story
  (interchangeable Tree/grid adapters) share one mount-timing contract;
  landing either without the other strands `LB-CB-02` / `CB-COMP-03`.
- Feel the deliberate-open tension (§S1): focus the Searchable input and
  the popup opens uninvited — quarantine called this an APG violation;
  mission law kept it. Killing focus-open belongs in the same gate as
  `closeOnBlur` (§3).
- Scalar is final (§11): token pickers are Field + Buttons (`FI-COMP-04`
  TokenPicker story, landed) — do not ask Combobox for chips.
