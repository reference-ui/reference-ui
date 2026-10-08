# Combobox features (needs design)

Items needing a product, UX, or API design call before implementation. Order follows DECISIONS: #1–#10 are candidates #1–#10, #11–#13 are gaps #1, #2, #5.

### 1. `autocomplete` modes (`none` | `list` | `both`) (from DECISIONS candidate #1)
- What it does: Inline completion of the active option's label with suffix-only selection and typed-prefix restore, plus synchronous `aria-autocomplete`.
- API: root `autocomplete?: "none" | "list" | "both"` (default `"list"`); `both` selects only the suggested suffix, restores the prefix when active clears, never emits `onInputValueChange` for preview navigation.
- Maintainer take: Yes — flagship UX gap; land at gate 5 with a real `both` consumer proving suffix editing.

### 2. `allowCustomValue` + custom-value commit semantics (from DECISIONS candidate #2)
- What it does: Policy deciding whether unmatched text commits as a free string or reverts to the last committed text on Enter, Tab, blur, and Escape.
- API: root `allowCustomValue?: boolean` (default `false`); `true` commits exact text via `onChange` (empty maps to `null`); `false` reverts unmatched Enter/Tab with no value callback.
- Maintainer take: Yes — the commit/revert keystone; needs HQ's full decision table before any branch lands.

### 3. `closeOnBlur` + blur policy (from DECISIONS candidate #3)
- What it does: Blur policy — dismiss plus commit-or-revert on blur, or a palette-style persistent popup that only Escape and explicit dismissal close.
- API: root `closeOnBlur?: boolean` (default `true`); `false` requests neither revert nor dismissal on blur; `true` commits allowed custom text or restores committed text, then dismisses.
- Maintainer take: Yes, after #2 — blur cannot choose commit-vs-revert until the custom-value policy exists.

### 4. `loading` → `aria-busy` + `announce()` empty/no-results (from DECISIONS candidate #4)
- What it does: Async states — a busy listbox plus shared-announcer empty and no-results messages, never a Combobox-private live region.
- API: root `loading?: boolean`; `true` sets listbox `aria-busy`; empty and no-results messages route through the shared `announce()`.
- Maintainer take: Yes, with the first async consumer — message prose and busy timing should not freeze speculatively.

### 5. `virtualFocus` grid adapter + `VirtualItem` + scroll timing (from DECISIONS candidate #5)
- What it does: Windowed-list navigation — a grid adapter with logical order, topology, and scroll handoff so `aria-activedescendant` publishes only after mount.
- API: `Combobox.Popover virtualFocus={gridAdapter}` plus `Combobox.VirtualItem index={n}`; adapter supplies complete order, `getNextIndex({key, currentIndex, direction})`, and `scrollToIndex`; stale requests cancel on metadata change.
- Maintainer take: Yes, at gate 7 or the first 100+-item consumer — largest subsystem, never build without mount-timing proof.

### 6. Tree bridge (nested Tree popup) (from DECISIONS candidate #6)
- What it does: Nested Tree popup — Combobox navigates visible Tree items, delegates horizontal keys to Tree, keeps input focus, and exposes matching `aria-haspopup="tree"`.
- API: No new Combobox props — Listbox and Tree expose their collection registries when nested; Combobox navigates visible items only.
- Maintainer take: Yes, once Tree publishes its registry contract — blocked cross-crew, not a Combobox solo build.

### 7. `onEscape` granular cancelable API (from DECISIONS candidate #7)
- What it does: Cancelable Escape hook fired before revert and dismiss, letting apps stop text revert, value callbacks, and high-level dismissal.
- API: root `onEscape?: (event: CancelableEscapeEvent) => void`; `preventDefault()` stops revert, callbacks, and dismissal while `open` and descendant DOM stay controlled.
- Maintainer take: Yes, but only inside the joint Overlay+Popover+Combobox dismiss design — never invented per component.

### 8. Select-only Trigger keyboard handling (from DECISIONS candidate #8)
- What it does: Select-only Trigger keyboard — arrows open and navigate, printable typeahead cycles matches, Home/End jump, focus stays on Trigger, nothing commits until activation.
- API: No new props — closed Trigger opens on ArrowDown/ArrowUp (first/last enabled by direction), typeahead buffer with timeout, Home/End to first/last enabled.
- Maintainer take: Yes, after #9 — preview-vs-commit needs source gating before typeahead lands.

### 9. `activeSource` (keyboard/pointer) + leave-clears + Tab eligibility (from DECISIONS candidate #9)
- What it does: Source-tagged active value — popover leave clears pointer-derived active only, and Tab commits keyboard-derived active only.
- API: Internal (possibly exposed for styling): `setActiveValue(val, source?)`; leave clears pointer-derived state while keyboard-derived survives; Tab never commits a stale pointer preview.
- Maintainer take: Yes, jointly with Listbox leave-clearing — split across crews or the two behaviors contradict.

### 10. `CB-OPEN-03` content gate (edit opens only with content) (from DECISIONS candidate #10)
- What it does: Typing into a closed Input requests `onOpen` only when popover collection content exists — no open spam from empty coordinators.
- API: No new props — edit-triggered `requestOpen` gated on authored-Popover-present plus logically-non-empty collection.
- Maintainer take: Yes, once Overlay defines closed-content observation — unprovable while closed popovers unmount.

### 11. Focus opens the popup (fights deliberate open) (from DECISIONS gap #1)
- What it does: Removes focus-open so opening comes only from arrows, real edits under the #10 gate, and explicit Trigger activation.
- API: No new props — behavior change: focus alone never opens; Input click-open stays gated to closed→open request.
- Maintainer take: Yes — quarantine called it an APG violation; kill it in the same gate that defines deliberate open (#3/#10).

### 12. Touch outside-dismiss without compat-mouse replay (from DECISIONS gap #2)
- What it does: One modality-correct dismiss for real touch sequences ending outside, with no compatibility-mouse replay second request.
- API: No new props — one blur/revert-or-commit plus dismissal path for outside touch; internal touches stay inside.
- Maintainer take: Yes, once a touch CT harness exists — mobile double-dismiss is a real bug class awaiting proof.

### 13. Select-only commit/revert mirror without text callbacks (from DECISIONS gap #5)
- What it does: Select-only mirror of the editable commit/revert matrix — Escape/Tab/blur semantics minus every text callback.
- API: No new props — documented commit-or-no-commit, one close, native focus, cleared active ID, zero `onInputValueChange`.
- Maintainer take: Yes, as the conformance half of the #2/#3 gate — never before the editable policy it mirrors.
