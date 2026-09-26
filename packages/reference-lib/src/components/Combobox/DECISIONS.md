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

Deferred items moved to FEATURES.md (needs design); only the declined item stays below in full.

### 1. `autocomplete` modes (`none` | `list` | `both`) — verdict: DEFERRED
→ Moved to FEATURES.md #1 (needs design: inline-completion caret/suffix machinery plus IME and announcement calls).

### 2. `allowCustomValue` + custom-value commit semantics — verdict: DEFERRED
→ Moved to FEATURES.md #2 (needs design: full commit/revert decision table plus trim and Tab semantics).

### 3. `closeOnBlur` + blur policy — verdict: DEFERRED
→ Moved to FEATURES.md #3 (needs design: containment machinery plus commit-vs-revert policy from #2).

### 4. `loading` → `aria-busy` + `announce()` empty/no-results — verdict: DEFERRED
→ Moved to FEATURES.md #4 (needs design: empty/loading/no-results contract plus message prose).

### 5. `virtualFocus` grid adapter + `VirtualItem` + scroll timing — verdict: DEFERRED
→ Moved to FEATURES.md #5 (needs design: mount-timing contract plus scroll ownership, cross-crew).

### 6. Tree bridge (nested Tree popup) — verdict: DEFERRED
→ Moved to FEATURES.md #6 (needs design: registry bridge plus expansion/typeahead ownership, blocked on Tree).

### 7. `onEscape` granular cancelable API — verdict: DEFERRED
→ Moved to FEATURES.md #7 (needs design: cancelable event shape, joint across Overlay/Popover/Combobox).

### 8. Select-only Trigger keyboard handling — verdict: DEFERRED
→ Moved to FEATURES.md #8 (needs design: typeahead buffer plus timeout/matching semantics, needs #9).

### 9. `activeSource` (keyboard/pointer) + leave-clears + Tab eligibility — verdict: DEFERRED
→ Moved to FEATURES.md #9 (needs design: source-gated commit plus public-vs-internal surface, needs Listbox).

### 10. `CB-OPEN-03` content gate (edit opens only with content) — verdict: DEFERRED
→ Moved to FEATURES.md #10 (needs design: closed-content observation contract from Overlay).

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

Moved items live in PATCHES.md (mechanical) or FEATURES.md (needs design), as noted per item.

### 1. Focus opens the popup (fights deliberate open) — verdict: DEFERRED
→ Moved to FEATURES.md #11 (needs design: breaking behavior change, dies with the deliberate-open gate).

### 2. Touch outside-dismiss without compat-mouse replay — verdict: OPEN
→ Moved to FEATURES.md #12 (needs design: touch-commit policy plus popover-chrome behavior are UX calls).

### 3. ShadowRoot contract + cross-engine parity — verdict: OPEN
→ Moved to PATCHES.md #1 (mechanical: parity proof against CB-ENV-03/04, no API surface).

### 4. Single layer + single dismissal sequence (CLOSE-03) — verdict: OPEN
→ Moved to PATCHES.md #2 (mechanical: audit proof against CB-CLOSE-03, no API surface).

### 5. Select-only commit/revert mirror without text callbacks — verdict: DEFERRED
→ Moved to FEATURES.md #13 (needs design: conformance mirror of the #2/#3 editable policy).

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

- Most important 1/3: `allowCustomValue` (FEATURES.md #2) — decides every
  commit/revert path (Enter, Tab, blur, Escape × matched/unmatched), and
  the prototype commits the active option even for unmatched text. Feel
  it in Book: Searchable story, type "zzz", press Enter — today it
  commits highlighted React; the freeze must define revert.
- Most important 2/3: `autocomplete="both"` (FEATURES.md #1) — inline
  completion is the flagship UX gap (suffix selection, prefix restore);
  no consumer ships "both" until HQ answers the IME + announcement
  questions.
- Most important 3/3: `virtualFocus` + Tree bridge (FEATURES.md #5–#6) —
  the scale story (windowed 100+ lists) and the palette story
  (interchangeable Tree/grid adapters) share one mount-timing contract;
  landing either alone strands `LB-CB-02` / `CB-COMP-03`.
- Feel the deliberate-open tension (FEATURES.md #11): focus the
  Searchable input and the popup opens uninvited — quarantine called
  this an APG violation; mission law kept it. Killing focus-open
  belongs in the same gate as `closeOnBlur` (FEATURES.md #3).
- Scalar is final (§11 declined, kept verbatim above): token pickers are
  Field + Buttons (`FI-COMP-04` TokenPicker story, landed) — do not ask
  Combobox for chips.
- Mechanical proofs (PATCHES.md #1–#2): ShadowRoot/cross-engine parity
  and single-layer dismissal are specified and pinnable — harness plus
  Overlay accounting, no design calls.
