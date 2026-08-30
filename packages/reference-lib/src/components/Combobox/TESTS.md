# Combobox test contract

Playwright: `matrix/lib/tests/e2e/combobox.spec.ts`  
Unit: `matrix/lib/tests/unit/combobox.test.ts`
Page: `/combobox`

Combobox owns coordination between an editable input or select-only button and
one popup collection. DOM focus stays on the input/trigger while an active
option is represented virtually. Listbox/Tree own collection semantics;
Popover/Overlay own chrome and layers.

## Public virtual-focus decisions

1. `VirtualFocusAdapter` supplies complete logical metadata and
   `scrollToIndex`; Listbox and Tree register their own movement automatically.
2. Custom grids pass `ComboboxGridAdapter` to Popup, whose
   `getNextIndex({key, currentIndex, direction})` owns grid topology and must
   return an enabled in-range index or `null`.
3. Transparent `Combobox.VirtualItem` applies the logical item's generated ID,
   state, StyleProps, refs, and events to one native mounted child.
4. Active descendant is published only after that child mounts; stale scroll
   requests are canceled when metadata or navigation intent changes.
5. Pointer and keyboard activation route one scalar commit through root
   `Combobox.onChange`; nested adapters never add another commit authority.

## Freeze decisions

- `allowCustomValue` explicitly controls typed-value commit; false restores
  unmatched text, true commits it under the cases below.
- Enter/pointer commits active; Tab commits while moving focus; Escape and blur
  without a valid/custom commit restore the last committed text.
- Valid anatomy is exactly one Input XOR Trigger and at most one Popup.
- Popup directly reuses Popover's positioning/policy integration, Overlay's
  shared layer stack, and Presence's exit detection while exposing a
  transparent Portal configuration. Combobox is one layer.
- Dialog popups move DOM focus and are a separate input + Popover/Overlay
  composition, not a virtual Combobox adapter.

Omitted `autocomplete`, `allowCustomValue`, and `closeOnBlur` mean
`"list"`, false, and true respectively. Omitted `value`/`inputValue` mean
controlled `null`/`""`, never hidden uncontrolled state.

These are API details inside Combobox, not reasons for separate Select,
Autocomplete, or CommandPalette primitives.

## Source evidence

- `vendor/downshift/src/hooks/useCombobox/__tests__/getInputProps.test.js` —
  input role/ARIA, active descendant, controlled handlers, Arrow/Page/Home/End
  contrast, Escape/Enter/Tab, IME, disabled options, blur, and outside touch.
- Downshift `useSelect` tests — button combobox, selected-item highlight,
  typeahead, disabled skip, and controlled state.
- `vendor/react-spectrum/packages/react-aria/test/combobox/useComboBox.test.js`
  and
  `vendor/react-spectrum/packages/react-aria-components/test/ComboBox.test.js`
  — commit on keyboard/Tab, form/read-only contrast, virtualization, scroll
  close, focus-style restoration, disabled/empty filtering, and Shadow DOM.
- Zag Combobox machine/connect — `none|list|both` input behavior and active
  descendant state.

## Required cases

### Anatomy, roles, and relationships

- [ ] `CB-DOM-01` `[reference]` `[browser]` —
  **Combobox should render a transparent coordinator with only its documented native parts.**
  Render separate editable and select-only fixtures, then inspect source and
  portal DOM before interaction. Assert Combobox adds no host, Input is a
  native `input`, Trigger is a native `button`, Popup is a native `div`, and
  no hidden focus source or duplicate overlay wrapper appears; coordination
  must remain structurally transparent.
- [ ] `CB-DOM-02` `[vendor]` `[browser]` —
  **Editable Combobox Input should expose controlled relationships for each autocomplete mode and popup role.**
  Render `none`, `list`, and `both` fixtures against registered Listbox, Tree,
  and custom grid adapters, then open and close each programmatically. Assert
  `role=combobox`, prop-authoritative `aria-expanded`, `aria-controls`
  resolving to Popup, matching `aria-autocomplete`, and `aria-haspopup`
  matching `listbox`, `tree`, or `grid`; this ports vendor input ARIA
  regressions without inventing popup roles.
- [ ] `CB-DOM-03` `[vendor]` `[browser]` —
  **Select-only Combobox Trigger should remain a button while exposing virtual-combobox state.**
  Render Trigger fixtures for Listbox, Tree, and grid adapters, then
  programmatically toggle `open`. Assert the native button also has
  `role=combobox`, controlled `aria-expanded`, Popup control linkage,
  role-matching `aria-haspopup`, and unchanged button semantics; this ports
  select-only virtual-focus behavior.
- [ ] `CB-DOM-04` `[reference]` `[browser]` —
  **Combobox Popup should own a stable ID while deriving collection role only from its active adapter.**
  Open otherwise identical Listbox, Tree, and grid fixtures, rerender them,
  and inspect Popup plus nested collection. Assert one stable unique Popup ID,
  no invented `listbox` or `tree` role because those nested collections supply
  their own, and `role="grid"` on Popup only when supplied by
  `ComboboxGridAdapter`; the coordinator cannot duplicate semantics.
- [ ] `CB-DOM-05` `[vendor]` `[browser]` —
  **Combobox should expose an active descendant only for a real mounted option while open.**
  Focus the source, open with mounted option `bravo` active, then close,
  clear active state, remove `bravo`, and repeat before its replacement mounts.
  Assert `aria-activedescendant` equals `bravo`'s real ID only in the valid
  open/mounted state and is otherwise omitted, while DOM focus never leaves
  the source; this ports active-ID lifecycle regressions.
- [ ] `CB-DOM-06` `[reference]` `[browser]` —
  **Combobox should honor explicit IDs and update every relationship atomically across roots.**
  Render equal Comboboxes in two React roots using generated IDs, then set and
  change explicit Input/Trigger, Popup, and option IDs during an open state.
  Assert explicit IDs win, generated peers remain unique, all controls and
  active-descendant references switch in the same commit, and no frame exposes
  a stale or cross-root ID; relationships must never be half-updated.
- [ ] `CB-DOM-07` `[reference]` `[browser]` —
  **Combobox parts should preserve native props, editing attributes, events, and refs.**
  Pass classes, styles, `data-*`, ordinary handlers, and refs to fixed parts,
  plus native input selection, `name`, `autoComplete`, `spellCheck`,
  `inputMode`, `disabled`, and `readOnly` attributes, then edit and rerender.
  Assert each reaches its documented host, selection/caret and attributes stay
  browser-native, refs remain stable, and internal handlers preserve consumer
  output; coordination must not replace native editing.
- [ ] `CB-DOM-08` `[reference]` `[browser]` —
  **Combobox should reject every ambiguous focus-source or popup anatomy.**
  Render Input plus Trigger, duplicate Inputs, duplicate Popups, and a root
  with neither Input nor Trigger in separate fixtures. Assert a descriptive
  diagnostic names the violated exactly-one-source/at-most-one-Popup rule
  before listeners, ARIA, layers, or callbacks become ambiguous; invalid
  anatomy cannot pick an authority by render order.
- [ ] `CB-DOM-09` `[reference]` `[browser]` —
  **Combobox Popup should be absent when closed and remain a nonmodal Popover during owned exit.**
  Open then close a Popup with and without Presence exit, Tab through the page,
  and inspect layer/background state. Assert ordinary closed content is
  unmounted, exit-kept chrome is closed and inert until its animation ends,
  open content is portalled/positioned through Popover, and no focus trap or
  background inerting occurs; Combobox remains nonmodal.
- [ ] `CB-DOM-10` `[reference]` `[browser]` —
  **Combobox should apply deterministic controlled defaults when optional behavior props are omitted.**
  Omit `value`, `inputValue`, `autocomplete`, `allowCustomValue`, and
  `closeOnBlur`, type unmatched `Zulu`, then blur while callbacks are ignored.
  Assert controlled `null`/`""`, `aria-autocomplete=list`, a request to restore
  committed-only text and dismiss on blur, and no hidden state change;
  truthiness cannot choose defaults.
- [ ] `CB-DOM-11` `[reference]` `[browser]` —
  **Editable Combobox should accept inputValue as its only controlled text authority.**
  Render root `inputValue="Alpha"` while also supplying Input `value="Bravo"`
  or `defaultValue="Charlie"`, or attach an Input `onChange` beside root
  `onInputValueChange`, then type a character. Assert the invalid props are
  rejected by the public type surface and produce a descriptive diagnostic
  when type checking is bypassed, before interaction, with no split DOM/prop
  value or competing callback path. Input may observe other native events, but
  cannot create a second editable store.
- [ ] `CB-DOM-12` `[reference]` `[browser]` —
  **Combobox Popup should use one Popover destination and one collision-safe default placement.**
  Open near a viewport boundary in document light DOM and an open ShadowRoot,
  then supply explicit Portal container and placement options. Assert default
  `bottom-start` placement with `8px` offset and collision handling in body or
  source ShadowRoot; assert resolved side/hide data plus
  `--reference-popover-available-width`,
  `--reference-popover-available-height`, anchor dimensions, and transform
  origin are published on Popup. Explicit props pass through once and no extra
  layer, host, or consumer-transform overwrite appears; popup chrome has one
  owner and applications can constrain long results from the inherited
  geometry contract.

### Controlled open state

- [ ] `CB-OPEN-01` `[vendor]` `[browser]` —
  **Editable Combobox should request opening on ArrowDown without disturbing focus or text.**
  Render closed with controlled input text `Al`, focus the Input, and press
  ArrowDown while delaying the parent update. Assert one `onOpen`, unchanged
  `aria-expanded=false` and absent Popup, DOM focus and caret still in Input,
  and text still `Al`; this ports vendor closed-arrow behavior without
  optimistic state.
- [ ] `CB-OPEN-02` `[vendor]` `[browser]` —
  **Combobox should request ArrowUp opening with the selected or last enabled option pending.**
  Render closed with selected enabled `bravo`, press ArrowUp, then repeat with
  no valid selection and a disabled final option before accepting open.
  Assert one `onOpen` and pending target `bravo` in the first fixture or the
  last enabled logical option in the second, exposed only after mount while
  focus stays on source; opening direction determines fallback.
- [ ] `CB-OPEN-03` `[convergence]` `[browser]` —
  **Editable Combobox should request one opening for a real edit only when popup collection content exists.**
  Type `a` into a closed controlled Input backed by options, then repeat edits
  with no Popup and with an empty logical collection. Assert one
  `onInputValueChange("a")` followed by one `onOpen` only for the populated
  fixture, no repeated open spam while the parent remains closed, and native
  text authority throughout; empty coordinators cannot open phantom content.
- [ ] `CB-OPEN-04` `[vendor]` `[browser]` —
  **Combobox should keep an open editable Input open while native Trigger activation toggles select-only state.**
  Click an already open Input, then in a separate select-only fixture activate
  its native Trigger once closed and once open without an application toggle
  handler. Assert Input click preserves open state and focus with no dismissal,
  while Trigger emits exactly one `onOpen` then one `onDismiss` and no
  synthetic duplicate; this intentionally differs from Downshift's input
  click toggle.
- [ ] `CB-OPEN-05` `[reference]` `[browser]` —
  **Combobox should keep expanded ARIA and Popup DOM controlled when open-state requests are rejected.**
  Trigger `onOpen` from a closed fixture and `onDismiss` from an open fixture
  while the parent records but does not rerender. Assert one callback each,
  closed remains `aria-expanded=false` with no Popup, open remains true with
  Popup/active state intact, and focus does not pretend a transition occurred;
  requests are not state.
- [ ] `CB-OPEN-06` `[reference]` `[browser]` —
  **Combobox should apply programmatic open and close without emitting user callbacks.**
  Focus the source, rerender `open` false→true with a valid active option and
  true→false again. Assert expanded ARIA, Popup, and mounted-only active ID
  update synchronously with props, focus stays on the source, and neither
  `onOpen` nor dismissal callbacks fire; external state changes are not user
  intent.
- [ ] `CB-OPEN-07` `[reference]` `[browser]` —
  **Combobox should let consumer event handlers cancel each corresponding open-state default.**
  Attach logging key, input, and pointer handlers that call
  `preventDefault()`, then press ArrowDown, type, and activate Trigger in
  separate fixtures. Assert each consumer handler runs first, the native edit
  result follows the browser where applicable, and no Combobox open/dismiss or
  active-state request follows; cancellation must be modality-local.
- [ ] `CB-OPEN-08` `[vendor]` `[browser]` —
  **Combobox should keep read-only and disabled focus sources from requesting interactive opening.**
  Focus/click/type/arrow a read-only Input, disabled Input, and disabled
  select-only Trigger. Assert no `onOpen`, no Popup or active descendant, no
  Combobox interactive key default, and native disabled/readOnly attributes
  remain; this ports vendor noninteractive-source behavior.

### Editable focus and native text editing

- [ ] `CB-EDIT-01` `[vendor]` `[browser:all]` —
  **Editable Combobox should navigate active options while DOM focus remains in its Input.**
  Open with `alpha` active, focus the Input at a concrete caret position, and
  press Down then Up. Assert `document.activeElement` and selection range stay
  on Input, `aria-activedescendant` moves between real mounted option IDs,
  Options have no tab stop, and no value callback fires; this is the defining
  virtual-focus invariant.
- [ ] `CB-EDIT-02` `[vendor]` `[browser]` —
  **Editable Combobox should route every real native text edit through one inputValue request.**
  Starting from controlled `Bravo`, perform typing, Backspace, Delete,
  selection replacement, paste, and native undo in separate steps. Assert the
  browser's exact resulting text and caret are passed once to
  `onInputValueChange` per `input` event, with no `onChange` commit or duplicate
  synthetic request; Combobox coordinates rather than reimplements editing.
- [ ] `CB-EDIT-03` `[reference]` `[browser]` —
  **Editable Combobox should preserve native horizontal, boundary, modifier, and caret commands.**
  Open a suggestion Popup, select part of Input text, and press Left, Right,
  Home, End, Option/Alt, Control, and Meta editing shortcuts. Assert native
  caret/selection/text outcomes and `defaultPrevented=false`, unchanged active
  option, and no collection/value callback; this deliberately rejects
  Downshift's Home/End collection navigation in editable mode.
- [ ] `CB-EDIT-04` `[reference]` `[browser]` —
  **Editable Combobox should distinguish Input self-scroll from composed ancestor scroll dismissal.**
  Open with overflowing Input text, dispatch its native scroll, then scroll a
  light-DOM or ShadowRoot ancestor according to Popover's close-on-scroll
  policy. Assert Input scroll preserves Popup, focus, and active ID, while
  ancestor scroll produces exactly one granular/high-level dismissal sequence
  with no lost composed event; this ports React Aria's light/shadow scroll
  regressions through the Popover owner.
- [ ] `CB-EDIT-05` `[vendor]` `[browser]` —
  **Editable Combobox should suppress commit, dismissal, and navigation while IME composition is active.**
  Start composition in the focused Input, emit composition input updates, and
  press Enter, Escape, Up, and Down including a `keyCode=229` event. Assert
  text requests reflect composition, but no value commit, dismissal, active-ID
  movement, prevented native composition key, or text corruption occurs; this
  ports the Downshift IME Enter regression.
- [ ] `CB-EDIT-06` `[vendor]` `[browser]` —
  **Editable Combobox should resume current filtered navigation and commit exactly once after compositionend.**
  End an IME composition producing a prefix that filters to `Bravo`, update
  controlled text/options, then press ArrowDown and Enter. Assert the mounted
  matching option becomes active, one scalar commit and matching label request
  occur in order, Popup dismissal follows once, and the composition event
  itself adds no duplicate; post-IME keys must use current data.
- [ ] `CB-EDIT-07` `[reference]` `[browser]` —
  **Editable Combobox should restore rejected controlled text without leaving an invalid selection range.**
  Set `inputValue="Alpha"`, place the caret at index 3, type `x`, and have the
  parent ignore `onInputValueChange`. Assert the callback requests `Alpxha`
  once, the DOM value returns to `Alpha`, `selectionStart/selectionEnd` remain
  clamped and usable, focus stays on Input, and no commit occurs; rejected
  edits cannot corrupt native selection.
- [ ] `CB-EDIT-08` `[vendor]` `[touch]` —
  **Combobox option activation should preserve modality-appropriate Input focus after commit.**
  Open an editable fixture on a touch device and tap `bravo`, then repeat with
  a mouse click. Assert each commits value/text and dismisses once, touch does
  not forcibly refocus Input or reopen the virtual keyboard, and mouse restores
  Input focus where the documented desktop path requires it; focus restoration
  must not erase modality.
- [ ] `CB-EDIT-09` `[vendor]` `[browser:all]` —
  **Editable Combobox should let an active IME composition finish without
  treating Tab or Escape as an option command.**
  Start a composition with `bravo` active, emit `compositionupdate` and native
  input for unmatched text, then press Tab and Escape in separate fixtures
  whose key events report `isComposing=true`. Assert neither key commits
  `bravo`, moves the active option, or runs the ordinary Escape revert path;
  Escape remains available to the IME, while Tab is not prevented and follows
  native focus traversal. After the browser's composition-end/blur sequence,
  assert at most one normal text-revert and dismissal sequence and no duplicate
  value request. This expands the Downshift and React Spectrum composition
  regressions beyond Enter and protects against stale active-option commits.

### Active option navigation

- [ ] `CB-NAV-01` `[vendor]` `[browser:all]` —
  **Open Combobox should wrap ArrowDown and ArrowUp through enabled logical options while focus stays on source.**
  Open with a middle option active and disabled neighbors present, then press
  Down/Up through both logical boundaries in editable and select-only fixtures.
  Assert mounted active IDs follow Listbox's next/previous enabled wrap policy,
  DOM focus remains on Input/Trigger, and no selection or text callback fires;
  this ports vendor virtual-arrow navigation.
- [ ] `CB-NAV-02` `[vendor]` `[browser]` —
  **Combobox should choose its initial active option from valid selection and opening direction.**
  Open closed fixtures with an enabled selected value, an absent/disabled
  selected value, and no selection using ArrowDown or ArrowUp. Assert the
  enabled selected option wins, otherwise Down chooses first enabled and Up
  chooses last enabled, with the active ID exposed only after open content
  mounts; initial highlighting must be deterministic.
- [ ] `CB-NAV-03` `[vendor]` `[browser]` —
  **Combobox should skip disabled candidates and expose no active ID for empty or all-disabled collections.**
  Open and navigate collections with disabled first, middle, and last options,
  then repeat with zero options and all options disabled. Assert movement
  lands only on enabled logical items, empty/all-disabled fixtures omit
  `aria-activedescendant`, preserve source focus, and emit no commit; this
  ports vendor disabled-index edge cases.
- [ ] `CB-NAV-04` `[convergence]` `[browser]` —
  **Editable Combobox should leave PageUp and PageDown native instead of jumping suggestions.**
  Open with more than 20 options and a middle active ID, focus text with a
  visible page scroll position, and press PageUp/PageDown. Assert the active
  ID and callbacks remain unchanged, native `defaultPrevented=false`, and
  browser page/input behavior remains available; Reference UI intentionally
  rejects Downshift's fixed ten-option jump.
- [ ] `CB-NAV-05` `[convergence]` `[browser]` —
  **Combobox should make pointer-hovered options active without moving focus or committing.**
  With Input focused and a keyboard-derived active option, move a mouse over
  enabled `bravo`, then leave Popup without pressing. Assert
  `aria-activedescendant` changes to `bravo` while hovered, DOM focus stays on
  Input, leaving clears only that pointer-derived active state, and no value,
  text, or dismissal callback fires; hover is preview, not selection.
- [ ] `CB-NAV-06` `[reference]` `[browser]` —
  **Combobox should preserve active identity or choose a deterministic mounted fallback as options change.**
  Open with `bravo` active, then filter, insert, remove, reorder, and disable
  options in separate rerenders. Assert identity `bravo` remains active when
  valid, otherwise its ID is cleared immediately and the next enabled logical
  neighbor is chosen only when mounted, with source focus and selection
  unchanged; stale collection indices cannot survive dynamic data.
- [ ] `CB-NAV-07` `[vendor]` `[browser]` —
  **Combobox should stop exposing or handling a stale active descendant whose element disappeared.**
  Remove the DOM node named by `aria-activedescendant` without first replacing
  active state, then press an otherwise native editing key. Assert the stale
  attribute is omitted before the key, native behavior is not prevented,
  source focus/caret remain valid, and no commit targets the removed value;
  this ports vendor absent-ID safety.
- [ ] `CB-NAV-08` `[reference]` `[browser]` —
  **Combobox should scroll each newly active mounted option within Popup without moving the page or Input.**
  Place a long Popup in a separately scrolled page, activate an off-viewport
  mounted option with arrows and pointer, and inspect scroll containers. Assert
  the option becomes visible within Popup, page and Input scroll offsets stay
  unchanged, source focus remains, and no extra open/value callback occurs;
  visibility correction belongs to the collection viewport.

### Autocomplete modes

- [ ] `CB-MODE-01` `[convergence]` `[browser]` —
  **Combobox autocomplete none should navigate suggestions without changing Input text before commit.**
  Render controlled text `Al` with `autocomplete="none"`, open, and arrow from
  `Alpha` to `Alpine`. Assert `aria-autocomplete="none"`, changing active IDs
  with source focus retained, unchanged displayed/controlled `Al`, and no text
  or value callback until Enter; mode none separates preview from text.
- [ ] `CB-MODE-02` `[vendor]` `[browser]` —
  **Combobox autocomplete list should open/filter on native edits while leaving typed text unchanged during navigation.**
  Render `autocomplete="list"`, type `al`, accept the controlled text/filter
  update, and arrow among `Alpha` and `Alpine`. Assert
  `aria-autocomplete="list"`, one text request per edit, Popup opening with
  current matches, active-ID movement, and displayed `al` unchanged until
  commit; this ports the conventional list-autocomplete contract.
- [ ] `CB-MODE-03` `[convergence]` `[browser]` —
  **Combobox autocomplete both should display an active completion and select only its suggested suffix.**
  Type controlled prefix `Al`, make `Alpha` active, and then type `p` while
  the suffix `pha` is selected. Assert `aria-autocomplete="both"`, displayed
  `Alpha` with selection range `[2,5]`, the next native edit replaces only
  that suffix to request `Alp`, and no value commit occurs; inline completion
  must preserve user-authored prefix.
- [ ] `CB-MODE-04` `[convergence]` `[browser]` —
  **Combobox autocomplete both should update completion across options and restore the typed prefix when none is active.**
  With typed prefix `Al`, arrow between `Alpha` and `Alpine`, then clear active
  state by pointer leave or dynamic filtering. Assert displayed completion and
  selected suffix track each active label, then return exactly to `Al` with
  its caret restored, without a text/value callback; preview state is
  reversible.
- [ ] `CB-MODE-05` `[reference]` `[browser]` —
  **Combobox autocomplete both should let Backspace and Delete edit inline completion natively without committing.**
  Display `Alpha` for prefix `Al` with suffix selected, then press Backspace
  and Delete in separate fixtures and accept each text request. Assert native
  resulting text/caret, recomputed suggestions and active ID, no `onChange`,
  and no dismissal unless filtering yields the documented empty behavior;
  completion is still editable text.
- [ ] `CB-MODE-06` `[reference]` `[browser]` —
  **Combobox should safely clear obsolete inline completion when autocomplete mode changes while open.**
  Start in `both` with `Alpha` completion and suffix selection, then
  programmatically switch to `list`, `none`, and back while source stays
  focused. Assert `aria-autocomplete` updates synchronously, displayed text
  returns to the controlled prefix, selection range is valid/collapsed, active
  ID remains only if valid, and no callbacks fire; mode props are
  authoritative.
- [ ] `CB-MODE-07` `[reference]` `[browser]` —
  **Combobox inline completion navigation should not masquerade as a user edit or commit.**
  In `both` mode, arrow through three matching options without typing or
  accepting one. Assert only displayed completion and native selection range
  change, `onInputValueChange` and `onChange` remain silent, controlled
  `inputValue` stays at the user's prefix, and Popup remains open; callbacks
  distinguish preview from authored state.

### Commit, revert, Tab, and blur

- [ ] `CB-COMMIT-01` `[vendor]` `[browser:all]` —
  **Combobox should commit an active option on Enter with one deterministic callback sequence.**
  Open with controlled value `alpha`, input text `Al`, and active option
  `{value:"bravo", label:"Bravo"}`, then press Enter. Assert ordered calls
  `onChange("bravo")`, `onInputValueChange("Bravo")`, granular dismissal, and
  high-level `onDismiss`, each once, followed by cleared active descendant and
  source focus; this ports vendor keyboard commit across engines.
- [ ] `CB-COMMIT-02` `[vendor]` `[browser]` —
  **Combobox should not invent a registered value when Enter is pressed with no active option.**
  With `allowCustomValue=false`, open on controlled value/text
  `"alpha"/"Alpha"`, type unmatched `Zulu`, clear active state, and press Enter.
  Assert no `onChange("Zulu")`, a request restoring Input text to `Alpha`,
  one dismissal sequence, and no stale active ID; registered-values-only mode
  must revert rather than fabricate identity.
- [ ] `CB-COMMIT-03` `[vendor]` `[browser]` —
  **Combobox should commit an option once by pointer or touch and ignore popup chrome.**
  Click and tap option `bravo` in separate fixtures, then click section headers
  and non-option Popup chrome. Assert option activation produces the same
  ordered value/text/dismiss requests once per modality, chrome produces none
  and leaves Popup open, and touch adds no synthetic mouse duplicate; this
  ports React Aria's section-header regression.
- [ ] `CB-COMMIT-04` `[vendor]` `[browser]` —
  **Combobox should commit a keyboard-derived active option on Tab or Shift+Tab
  while preserving native focus traversal.**
  Place tabbables immediately before and after an open Combobox, derive active
  `bravo` with the keyboard, then press Tab and Shift+Tab in separate fixtures.
  Assert each commits `bravo` and matching text once, requests close, clears
  active state, and lets native focus land forward/backward without prevention
  or trapping. Eligibility is tied to current keyboard intent, not any stale
  pointer preview; this narrows the vendor Shift+Tab commit behavior.
- [ ] `CB-COMMIT-05` `[reference]` `[browser]` —
  **Combobox should revert unmatched text on Tab when no option is active without selecting a value.**
  Open with committed `"alpha"/"Alpha"`, type unmatched `Zulu`, ensure no
  active option, and press Tab. Assert no value callback, one text request for
  `Alpha`, one close sequence, cleared active ID, and native focus on the next
  tabbable; blur commitment cannot create an option.
- [ ] `CB-COMMIT-06` `[vendor]` `[browser]` —
  **Controlled Combobox should not emit a second selection when focus leaves after an accepted commit.**
  Accept a pointer or Enter commit of `bravo` by updating both controlled
  value and input text, then move focus away by click and Tab in separate
  runs. Assert `onChange("bravo")` occurred exactly once, no extra text or
  selection request appears on blur, committed DOM text remains `Bravo`, and
  Popup stays closed; this ports React Aria's “should not fire extra
  onSelectionChange calls after focus moves away” regression.
- [ ] `CB-COMMIT-07` `[vendor]` `[browser]` —
  **Combobox should not commit on Tab after pointer leave clears the current
  highlight.**
  Open with keyboard-active `bravo`, move the pointer over `charlie`, leave
  Popup so `CB-NAV-05` clears the pointer-derived active state, and press Tab.
  Assert no value request for either option, one committed-text restoration
  when needed, one dismissal sequence, cleared active descendant, and native
  focus on the next control. This ports Downshift
  `getInputProps.test.js` “highlight by mouse leaves the menu” and prevents
  `CB-COMMIT-04` from reviving a stale highlight.
- [ ] `CB-COMMIT-08` `[vendor]` `[browser]` —
  **Combobox should prevent an open Enter commit from submitting its containing
  form.**
  Put an open editable Combobox with active `bravo` in a form, observe the
  keydown from a parent listener, and press Enter. Assert the handled event is
  `defaultPrevented`, the form submit handler is not called, and the ordinary
  value, text, and dismissal callbacks still run once in their documented
  order. This ports React Aria `useComboBox.test.js` “should prevent default on
  Enter if isOpen” without suppressing the commit itself.
- [ ] `CB-COMMIT-09` `[vendor]` `[browser]` —
  **Combobox should leave Tab entirely native when its popup is closed.**
  Focus a closed Input containing committed text and press Tab and Shift+Tab
  in separate fixtures with surrounding controls. Assert no value, text,
  active, open, or dismissal request, `defaultPrevented=false`, and native
  focus traversal in the requested direction. This ports React Aria
  `useComboBox.test.js` “should only call commit on Tab when the menu is open.”
- [ ] `CB-REVERT-01` `[vendor]` `[browser]` —
  **Combobox should restore the last committed state and dismiss when Escape is pressed while open.**
  Open with committed `"alpha"/"Alpha"`, edit to controlled `Alp`, activate
  `bravo`, and press Escape before commit. Assert a text restoration request
  for `Alpha` without value change, cleared active descendant, one dismissal
  sequence, and Input focus retained; Escape cancels the editing session.
- [ ] `CB-REVERT-02` `[reference]` `[browser]` —
  **Combobox should let granular onEscape cancellation stop revert and high-level dismissal.**
  Attach `onEscape` that logs and calls `preventDefault()`, open with unmatched
  controlled text and an active option, then press Escape. Assert `onEscape`
  runs first, no text/value/high-level dismissal callback follows, `open` and
  active-descendant DOM remain controlled, and focus stays on source;
  cancellation must stop at the granular owner.
- [ ] `CB-REVERT-03` `[convergence]` `[browser]` —
  **Combobox should revert unmatched blur text but retain text after an explicit commit.**
  Blur an open no-custom fixture containing unmatched `Zulu`, then in a fresh
  fixture explicitly commit `bravo` before blurring outside. Assert the first
  sequence requests committed text restoration then dismissal with no value
  commit, while the second retains `Bravo` and emits no duplicate commit;
  blur distinguishes editing from accepted state.
- [ ] `CB-REVERT-04` `[reference]` `[browser]` —
  **Closed Combobox should leave committed state and Escape propagation untouched.**
  Focus a closed Input with controlled `"alpha"/"Alpha"`, dispatch Escape
  inside an ancestor key listener, and observe the native event. Assert no
  value, text, active, or dismissal request, unchanged DOM text, and
  `defaultPrevented=false` with ancestor propagation intact; a closed
  coordinator has nothing to revert.
- [ ] `CB-REVERT-05` `[reference]` `[browser]` —
  **Combobox should expose callback intent without mutating any rejected controlled state.**
  Render open with `"alpha"/"Al"`, trigger active-option commit, Escape revert,
  and outside dismissal in separate fixtures while the parent ignores every
  callback. Assert each documented callback order/argument is logged once but
  rendered `value`, `inputValue`, `open`, Popup, and ARIA remain exactly
  prop-authoritative; requests cannot create a hidden accepted state.
- [ ] `CB-REVERT-06` `[reference]` `[browser]` —
  **Combobox should not derive editable display text implicitly from a programmatic value change.**
  Rerender controlled `value` from `alpha` to `bravo` while holding
  `inputValue="Custom display"`, then explicitly update `inputValue` to
  `Bravo`. Assert the first change updates selection semantics but not Input
  text, the second updates text, and no value/text/commit callback fires;
  display remains governed only by the controlled text contract.
- [ ] `CB-REVERT-07` `[reference]` `[browser]` —
  **Combobox should preserve editing state on blur when closeOnBlur is false.**
  Set `closeOnBlur=false`, open with unmatched controlled text, and move focus
  to an outside button before separately pressing Escape and issuing an
  outside-layer dismissal. Assert blur alone requests neither revert nor
  dismissal and leaves open/text state intact, while Escape and explicit layer
  dismissal still invoke their documented sequences; blur policy must not
  disable all closing.
- [ ] `CB-CUSTOM-01` `[reference]` `[browser]` —
  **Combobox should commit exact unmatched text on Enter only when custom values are allowed.**
  Type controlled text `New value` with no active option and press Enter in
  `allowCustomValue=true` and false fixtures. Assert true requests
  `onChange("New value")` then one dismissal without normalizing the string,
  while false emits no custom value and requests committed-text revert;
  explicit policy owns the custom-value boundary.
- [ ] `CB-CUSTOM-02` `[reference]` `[browser]` —
  **Combobox should commit exact custom text once on blur and map an empty custom value to null.**
  With custom values and close-on-blur enabled, blur controlled `New value`,
  then blur an empty Input, while first accepting and then rejecting parent
  requests. Assert one commit of `"New value"` or `null` followed by dismissal,
  no duplicate blur commit, and rejected props remain unchanged with no hidden
  committed state; empty text must not be confused with an option ID.

### Select-only Trigger

- [ ] `CB-SELECT-01` `[vendor]` `[browser]` —
  **Select-only Combobox should leave Trigger labeling to the application and activate the controlled selected option on open.**
  Render value `bravo` with Trigger text `Chosen: Bravo`, then open by pointer
  and programmatic state. Assert Combobox does not rewrite Trigger children,
  source focus remains on the button, and `aria-activedescendant` identifies
  mounted enabled `bravo`; this ports select behavior without a hidden display
  store.
- [ ] `CB-SELECT-02` `[vendor]` `[browser:all]` —
  **Select-only Combobox should open from ArrowDown or ArrowUp while retaining Trigger focus.**
  From closed fixtures with valid, absent, and disabled selected values, press
  ArrowDown or ArrowUp and accept the open request. Assert one `onOpen`,
  Trigger focus throughout, selected active target when valid or first/last
  enabled target by direction, and mounted-only active ID; this ports the
  select keyboard entry matrix.
- [ ] `CB-SELECT-03` `[vendor]` `[browser]` —
  **Select-only Combobox should open and cycle enabled matches from printable Trigger typeahead.**
  Focus a closed Trigger over `Apple`, disabled `Apricot`, and `Avocado`, then
  type `a` repeatedly before and after the buffer timeout. Assert one open
  request if needed, active IDs cycle/wrap only enabled matches, DOM focus
  never leaves Trigger, and no value commits until activation; typeahead is
  virtual preview.
- [ ] `CB-SELECT-04` `[vendor]` `[browser]` —
  **Select-only Combobox should use one native button activation path for opening and committing.**
  Press Enter or Space on a closed Trigger, accept open, set `bravo` active,
  and press the key again. Assert one initial open request, then one scalar
  commit and matching root dismissal with no second Popover toggle, synthetic
  click duplicate, or Input callback; native button semantics must not be
  wrapped by another toggle handler.
- [ ] `CB-SELECT-05` `[reference]` `[browser]` —
  **Select-only Combobox should mirror commit/revert closing and focus behavior without editable-text callbacks.**
  In separate open fixtures press Escape, Tab, Shift+Tab, and move focus
  outside with and without an active option. Assert the documented value
  commit or no-commit, one close sequence, native directional focus movement
  or retained Trigger focus as applicable, cleared active ID, and zero
  `onInputValueChange`; select-only has no text authority.
- [ ] `CB-SELECT-06` `[reference]` `[browser]` —
  **Select-only Combobox Trigger should default to type button and avoid accidental form submission.**
  Put an omitted-type Trigger in a form with a submit spy, open it, and select
  an option by pointer and keyboard, then explicitly rerender `type=submit`.
  Assert default `type="button"` and no submit during selection, while the
  explicit native submit choice remains application-owned; Combobox cannot
  silently submit forms.
- [ ] `CB-SELECT-07` `[vendor]` `[browser]` —
  **Select-only Combobox should keep disabled sources and selected options out of active navigation.**
  Render a disabled Trigger, then an enabled Trigger whose controlled selected
  option is disabled, and try click, arrows, typeahead, Enter, and Space.
  Assert disabled Trigger never opens, disabled selected option never becomes
  active or commits, fallback navigation chooses an enabled option, and
  controlled selected ARIA remains representable; this ports disabled select
  behavior.
- [ ] `CB-SELECT-08` `[vendor]` `[browser:all]` —
  **Select-only Combobox should send Home and End to the first and last enabled
  logical options while Trigger keeps DOM focus.**
  Open a Trigger-backed fixture with disabled boundary and middle options,
  press Home and End from a middle active value, and repeat after virtualizing
  the destination. Assert the active descendant becomes the first or last
  enabled mounted option, or waits behind one current `scrollToIndex` until it
  mounts, while Trigger focus, controlled value, and callbacks remain
  unchanged. Editable Input keeps Home/End native under `CB-EDIT-03`; this
  ports Downshift `useSelect` rather than leaking collection keys into text
  editing.

### Virtualized/Listbox/Tree adapters

- [ ] `CB-VIRT-01` `[reference]` `[browser]` —
  **Combobox should scroll a windowed Listbox target into the DOM before exposing its active ID.**
  Mount logical indices 0–4 with index 4 active, press ArrowDown toward
  unmounted enabled index 5, and delay the virtualizer rerender. Assert one
  `scrollToIndex(5)`, source focus and old/omitted active ID while absent, then
  `aria-activedescendant` equal to index 5's real ID only after mount; active
  timing cannot reference imaginary DOM.
- [ ] `CB-VIRT-02` `[reference]` `[browser]` —
  **Combobox should cancel stale virtual targets during rapid navigation and filtering.**
  Press three navigation keys while the first requested window is pending,
  then replace/filter logical metadata before mounting the latest target.
  Assert stale scroll/active requests cannot win, every exposed active ID
  resolves at that instant, only the latest collection/callback is used, and
  source focus remains; asynchronous virtualization must preserve current
  intent.
- [ ] `CB-VIRT-03` `[reference]` `[browser]` —
  **Combobox should preserve complete set metadata, controlled selection, and value identity in virtual options.**
  Open a 100-item window with controlled selected value at logical index 75,
  navigate to and mount it, then commit. Assert mounted options retain
  `aria-setsize=100` and correct one-based `aria-posinset`, index 75 is
  immediately selected when mounted, and one commit returns its logical value
  rather than DOM index; windowing must not alter semantics.
- [ ] `CB-TREE-01` `[reference]` `[browser]` —
  **Combobox should navigate only visible Tree items and delegate horizontal expansion while Input retains focus.**
  Open a nested Tree popup with collapsed and expanded branches, arrow
  vertically, then use direction-appropriate expansion keys. Assert active IDs
  visit only mounted enabled visible treeitems, Tree receives one controlled
  expansion request, Input remains `document.activeElement`, and no scalar
  commit occurs until Item activation; hierarchy stays Tree-owned.
- [ ] `CB-ADAPTER-01` `[reference]` `[browser]` —
  **Combobox should coordinate a custom grid adapter without imposing Listbox semantics or another overlay.**
  Pass a `ComboboxGridAdapter` whose complete logical order and
  `getNextIndex` describe a two-dimensional grid, then navigate, scroll, and
  commit from the source. Assert Popup receives `role="grid"`, authored
  row/gridcell semantics remain unchanged, only real mounted active IDs are
  exposed, one scalar commit occurs, and one Popover/layer runtime positions
  and dismisses content; the public bridge is not Listbox-shaped.
- [ ] `CB-ADAPTER-02` `[reference]` `[browser]` —
  **Combobox should be the sole commit callback authority for nested Listbox or Tree adapters.**
  Activate an Option/TreeItem in a valid adapter without nested `onChange`,
  then repeat while supplying both collection and Combobox callbacks. Assert
  the valid action calls only Combobox `onChange(value)` once, while the
  invalid anatomy produces a descriptive two-authority diagnostic and never
  invokes both updates; nested semantics do not imply nested state ownership.
- [ ] `CB-ADAPTER-03` `[reference]` `[browser]` —
  **Combobox should reject a multiple-selection Listbox adapter because its commit contract is scalar.**
  Place `selection="multiple"` Listbox under Combobox and attempt to open and
  activate an Option. Assert a descriptive incompatibility diagnostic before
  active/commit callbacks or ambiguous ARIA are established, with no array
  passed to scalar `onChange`; chips and tokenized input remain a higher-level
  composition.
- [ ] `CB-ADAPTER-04` `[reference]` `[browser]` —
  **Combobox VirtualItem should slot stable logical state onto exactly one native grid child.**
  Render enabled, disabled, selected, and active logical cells through
  `Combobox.VirtualItem`, then rerender, move mouse/pen, click/tap, and read
  composed consumer StyleProps, native props, refs, and events. Assert no
  wrapper, no generated child ID before mount, one stable value-derived ID
  after mount, authoritative `aria-disabled`/`data-disabled`,
  `aria-selected`/`data-selected`, and `data-active`, merged StyleProps,
  preserved ref/event order, mounted-only active exposure, and one root
  commit; transparent slotting must not create another collection owner.
- [ ] `CB-ADAPTER-05` `[reference]` `[browser]` —
  **Combobox should diagnose invalid custom-grid metadata, navigation targets, and VirtualItem children before activation.**
  Exercise duplicate logical values, duplicate or out-of-range mounted
  indices, a disabled/out-of-range `getNextIndex` result, and a fragment or
  zero/multiple/non-ref-capable VirtualItem child. Assert a descriptive
  diagnostic for each fixture, no invalid/generated ID in
  `aria-activedescendant`, no scroll or commit to the bad target, and recovery
  with the latest valid adapter on rerender; malformed grid anatomy cannot
  become interactive.
- [ ] `CB-ADAPTER-06` `[reference]` `[browser:all]` —
  **Combobox VirtualItem should let consumer pointer handlers cancel active preview and commit independently.**
  Give an enabled mounted cell logging `onPointerMove` and `onClick` handlers,
  first prevent mouse/pen movement and then prevent primary click/tap in
  separate fixtures while Input remains focused. Assert consumer handlers run
  before Combobox defaults, prevented movement leaves `data-active` and
  `aria-activedescendant` unchanged, prevented activation calls no root
  `onChange` or dismissal, and unprevented movement plus activation makes the
  real child active then commits exactly once; cancellation must not leak
  between preview and commit phases.
- [ ] `CB-ADAPTER-07` `[reference]` `[browser]` —
  **Combobox grid typeahead should follow current metadata and cancel stale offscreen requests after replacement or reorder.**
  Start a prefix search for unmounted logical `Zulu` index 37, then before its
  scroll resolves replace/reorder `items`, change `scrollToIndex`, and make the
  same value index 12 with updated `textValue="Bravo"`. Assert the stale
  index-37 callback/mount cannot publish an ID, old `Zulu` no longer matches,
  typing `b` calls only the latest `scrollToIndex(12)`, and the generated ID
  becomes active only after index 12 mounts; value identity and current
  metadata must win over asynchronous closures.
- [ ] `CB-ADAPTER-08` `[reference]` `[browser]` —
  **Combobox should reject more than one virtual-focus collection authority in
  a Popup.**
  Supply Popup `virtualFocus` while also nesting a registering Listbox or Tree,
  and repeat with two built-in collections. Assert a descriptive diagnostic
  identifies both authorities before Popup role, movement, scroll, active ID,
  or commit wiring is established; neither adapter receives a callback and a
  rerender with exactly one authority recovers cleanly. Render order must not
  choose between competing topology and identity models.

### Dismissal, layers, and environments

- [ ] `CB-CLOSE-01` `[reference]` `[browser]` —
  **Combobox should dismiss once from a true outside press and ignore every internal branch interaction.**
  Open a controlled Popup, press Input/Trigger, Popup chrome, and an Option,
  then press an unrelated outside control in separate non-commit fixtures.
  Assert internal paths are not outside, while the external press calls its
  granular handler then high-level `onDismiss` exactly once with source focus
  behavior intact; composed ownership must cross the portal.
- [ ] `CB-CLOSE-02` `[reference]` `[browser]` —
  **Combobox Popup should register as an Overlay branch when composed inside a parent Overlay.**
  Open Combobox inside a modal Overlay, click within its portalled Popup and
  then inside the parent but outside Combobox. Assert Popup interaction does
  not dismiss either owner, parent-internal/Combobox-external interaction
  requests only Combobox close once, and the parent layer remains; Overlay
  owns the full shared stack matrix.
- [ ] `CB-CLOSE-03` `[reference]` `[browser]` —
  **Combobox should produce one layer and one dismissal sequence while sharing Popover positioning.**
  Open one Popup and trigger Escape or outside press in separate fixtures while
  logging Popover/Combobox callbacks and layer-visible state. Assert a single
  layer entry, granular-before-high-level dismissal exactly once, one
  positioned Popup, and no duplicate Menu/Popover-style runtime; composition
  must not double-register the same event.
- [ ] `CB-CLOSE-04` `[reference]` `[browser]` —
  **Combobox should clear open and active semantics immediately while Presence finishes visual exit.**
  Close a controlled open Popup whose Presence exit lasts 200ms, inspect at
  close commit and after the transition event. Assert source
  `aria-expanded=false` and no active descendant immediately, exit-kept Popup
  is closed/inert and absent from the active layer, then unmounts only on its
  own exit with no extra dismissal callback; visual lifetime cannot extend
  interaction lifetime.
- [ ] `CB-CLOSE-05` `[vendor]` `[touch]` —
  **Combobox should dismiss once when a touch finishes outside and should not
  replay that dismissal through a compatibility mouse path.**
  Open Popup, perform a real touch sequence on `document.body`, and repeat on
  Input and Popup descendants. Assert the outside sequence produces one
  modality-correct blur/revert-or-commit and dismissal path, internal touches
  remain inside, and no later compatibility `mousedown`/click adds a second
  text, value, or close request. This ports Downshift's body `touchend`
  `InputBlur` regressions while preserving composed inside paths.
- [ ] `CB-ENV-01` `[reference]` `[ssr]` —
  **Combobox should hydrate closed anatomy and IDs before establishing mounted active descendants.**
  Server-render controlled closed editable and select-only fixtures with
  values/explicit IDs, hydrate, then open and navigate. Assert no browser-
  global server access, hydration warning, changed/duplicate relationship ID,
  or callback during hydration, and active descendant appears only for a real
  post-mount option; closed SSR must be deterministic.
- [ ] `CB-ENV-02` `[reference]` `[react:all]` —
  **Combobox should issue one registration and request per action across React versions and StrictMode.**
  Under StrictMode in React 17, 18, and 19, type one edit, navigate, commit,
  dismiss, and dynamically remove an option. Assert one live adapter
  registration, one text request, one commit, one dismissal sequence, and no
  stale ref/listener after removal; effect replay and batching must be
  unobservable.
- [ ] `CB-ENV-03` `[reference]` `[shadow]` —
  **Combobox should preserve focus, outside paths, active IDs, and virtual scrolling inside a ShadowRoot.**
  Mount source and windowed collection in an open ShadowRoot using the
  documented portal destination, then edit, navigate beyond the window, press
  inside, and press outside. Assert source focus is discovered in the owning
  root, active IDs resolve there, one current scroll request occurs, composed
  inside paths remain open, and true outside paths dismiss once.
- [ ] `CB-ENV-04` `[reference]` `[browser:all]` —
  **Combobox should produce identical native and virtual behavior in Chromium, Firefox, and WebKit.**
  Run native edit/caret/undo, IME, active navigation, all autocomplete modes,
  commit/revert/Tab, select-only, and windowed mount-timing fixtures in each
  engine. Assert the same public DOM, focus, controlled callback order, and
  mounted-only active references, allowing only documented native text
  differences; jsdom cannot prove these paths.
- [ ] `CB-ENV-05` `[vendor]` `[react:all]` —
  **Combobox should keep collection registration bounded when options are
  produced by a new inline render function on every render.**
  Render current items through an inline mapping/render callback, rerender the
  controlled Input while typing and filtering, and instrument render,
  registration, and adapter notifications under StrictMode. Assert work
  settles after each update, each live option has one current registration,
  active identity remains stable by value, and no maximum-depth error or
  request loop occurs. This ports React Aria `useComboBox.test.js` “should not
  infinite loop when children is an inline function.”
- [ ] `CB-A11Y-01` `[reference]` `[browser]` —
  **Combobox should pass accessibility checks across every frozen source and adapter shape.**
  Scan named `none`, `list`, and `both` editable fixtures plus select-only,
  disabled, empty, virtualized Listbox, and Tree Popup states after opening and
  navigation. Assert no violations and exact role/name/expanded/control/
  autocomplete/haspopup/active-descendant relationships; automation
  supplements focus and callback proofs.

## Composition gates

- [ ] `CB-COMP-01` `[reference]` `[browser]` —
  **Select-only Combobox should compose a button source with a virtualized Listbox.**
  Build a controlled Trigger over 100 logical options with disabled and
  offscreen selected values, then open by pointer/keys, typeahead and arrow
  beyond the window, commit, Tab, and resize. Assert Trigger focus,
  mounted-only active IDs, exact scroll/index and scalar commit callbacks,
  accurate set metadata, one layer, and no accidental form submit; this is the
  select virtualization gate.
- [ ] `CB-COMP-02` `[reference]` `[browser]` —
  **Editable Combobox should prove native editing and reversible completion in list and both modes.**
  Build controlled `list` and `both` fixtures with dynamic filtering, IME,
  unmatched text, and disabled options, then edit, navigate, commit, Escape,
  blur, Tab, and reject selected requests. Assert native caret/text behavior,
  mode-specific completion, one ordered callback sequence, retained Input
  focus, and no stale active ID or hidden state.
- [ ] `CB-COMP-03` `[reference]` `[browser]` —
  **CommandPalette should compose Overlay and Combobox with interchangeable Tree and custom-grid adapters.**
  Place editable Combobox in a locked Overlay, run one Tree popup and one
  custom grid variant, then navigate/expand/scroll/commit and dismiss across
  portalled branches. Assert one parent/child layer model, DOM focus retained
  on Combobox Input in both variants, collection-authored roles, one scalar Combobox commit,
  and no nested callback/overlay authority; this proves the public
  `VirtualFocusAdapter` bridge is not listbox-locked.
- [ ] `CB-COMP-04` `[reference]` `[shadow]` —
  **Combobox should preserve virtual focus, modal isolation, and composed
  outside detection when it runs inside an Overlay in a ShadowRoot.**
  Mount a locked Overlay in an open ShadowRoot, place Combobox Input in
  Content, portal a windowed Popup to its documented shadow destination, then
  navigate offscreen, press inside Popup, and touch outside the Overlay. Assert
  DOM focus stays on Input while every active ID resolves in the same root,
  background remains inert, Popup is one FocusLock branch, internal composed
  paths stay open, and the true outside path dismisses only the top affected
  layer once. This adversarial gate joins the separately owned shadow, inert,
  layer, and virtual-focus contracts.

## Owned elsewhere

- List selection, disabled/typeahead, and virtual metadata: `Listbox`.
- Visible nested hierarchy: `Tree`.
- Position/size/portal: `Popover`.
- Shared nested layer dismissal and focus lock: `Overlay`.

## Out of scope

- Filtering/ranking helpers, multiple selection/chips, form serialization/
  validation, async loading UI, status-message prose, DOM-focus dialog popups,
  cmdk Dialog wrapper, Downshift render props, or Zag's positioning runtime.
  React Spectrum `ComboBox.test.js` multi-select, `formValue`, and section-
  filtering suites are deliberately left in those product/form owners rather
  than silently approximated by this scalar coordinator.
