# Announcer SPEC

Current freeze, cases, and proof. Design narrative: [README.md](./README.md).
Mounted by: [ReferenceLibrary](../ReferenceLibrary/ReferenceLibrary.md).
Used by: [Toast](../Toast/Toast.md) `{announce}` and any `announce()` caller.

Playwright: `matrix/lib/tests/e2e/announcer.spec.ts` (missing)
Unit: `packages/reference-lib/src/components/Announcer/Announcer.test.ts`
Page: `/announcer` (missing)
Sibling proof: `matrix/lib/tests/e2e/toast.spec.ts` · `reference-library.spec.ts`
Fixture root: `ReferenceLibrary`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID **and** the
  test asserts the prose.
- `[ ]` Specified; not proven by a passing test title. The engine may still
  exist in source.

## Next agent — Announcer is not production

The engine exists as a Toast / ReferenceLibrary appendix. It is not a frozen
runtime. Five Vitest cases poke a fake `Document` object and never paint live
regions. Toast Playwright covers a subset of speech vs visual (`TO-ANN-*`).
ReferenceLibrary covers mount/election smokes (`RL-*`). None of those titles
are `ANN-*`, and several production holes are untested.

Do not add Toast queue, swipe, or toaster chrome here. Do not add Overlay
dismiss / inert / FocusLock catalogs. Do not add a public Provider, a second
live-region library, or per-widget `aria-live` on NumberField / Toast cards.

### What Announcer supports (the surface)

| Axis | Public surface | Status |
| :--- | :--- | :--- |
| Call | `announce(message, { politeness, document })` | Shipped; untargeted multi-document routing is wrong |
| Channels | One polite `role="status"` and one assertive `role="alert"` | Shipped |
| Replay | Pending queue until first host activation | Shipped; activation is sticky after unmount |
| Isolation | `data-reference-overlay-ignore` + hide-outside exempt | Shipped; no `ANN-*` proof |
| Clear | Same-string clear-then-reinsert; 7000ms recycle | Shipped in the store; AT DOM under-proven |

### Do not duplicate

| If you are about to write… | Stop. It lives here |
| :--- | :--- |
| Visual toast host, FIFO limit, swipe, remaining time | Toast `TO-*` |
| Toast `{announce}` vs silent visual JSX | Toast `TO-ANN-03` / `04` / `06` |
| Library election, failover, toaster defaults | ReferenceLibrary `RL-*` |
| Overlay inert / hide-outside keep-live algorithm | Overlay `OV-INERT-*`; Announcer only proves the announcer node stays live |
| Private live regions inside NumberField / Slider / etc. | Those specs must call `announce()`, not grow a second engine |
| `as`, Provider, `timeout` per call, `clearAnnouncer` | Out of scope |

Sibling titles that already exist (do not restate as new product):

| Sibling ID | Announcer-owned restatement |
| :--- | :--- |
| `TO-ANN-01` | `ANN-LIVE-01` |
| `TO-ANN-02` | `ANN-LIVE-02` |
| `TO-ANN-05` | `ANN-LIVE-03` |
| `TO-ANN-07` | `ANN-LIVE-04` |
| `TO-ANN-08` / `RL-LIFE-02` | `ANN-LIFE-01` |
| `TO-ANN-03` / `04` / `06` | `ANN-COMP-01` / `02` (Toast-owned; smoke only) |
| `RL-DOM-02` / `RL-ROOT-01` / `02` / `06` | `ANN-HOST-01` / `02` / `03` |
| `RL-ROOT-08` | `ANN-API-05` — **not actually implemented on `announce()`** |

When adding `announcer.spec.ts`, dual-title with the sibling ID if the same
fixture already asserts the prose. Do not copy a weak `toBeVisible()` check
and call it done.

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Shipped (two-channel store, host, pending, 7s clear, overlay-ignore) |
| Production | **No.** Host-activation, document routing, AT-safe remount, and overlay exemption are not `ANN-*` proven. |
| Named `ANN-*` | 0 / 41 |
| Vitest | 5 store tests (`TO-ANN-01` / `02` / `05` / `07` / `08` titles) against `{} as Document` |
| Playwright | 0 Announcer files. Toast + ReferenceLibrary smokes only |

### Defects this freeze names

1. **Sticky `activated`.** `replayPendingAnnouncements` sets `activated = true`
   and never clears it when the last subscriber unmounts. After the first
   host, hostless `announce()` does not re-queue. Remount can paint current
   store text as **initial** live-region content, which AT often does not
   speak. `RL-LIFE-05` claims hostless `announce("Connection restored")`
   replays; the announcer machine does not honor that.
2. **Untargeted multi-document.** `announce()` with omitted `document` always
   writes to global `document`. ReferenceLibrary freeze `RL-ROOT-08` requires
   a development diagnostic and a no-op when more than one Document is
   eligible. Toast follows that freeze; Announcer does not.
3. **Duplicate hosts.** `AnnouncerHost` has no election. Two direct mounts
   subscribe independently and double-speak. Production depends entirely on
   ReferenceLibrary rendering the host only on the elected mount.
4. **Public surface leak.** `export *` publishes `AnnouncerHost`,
   `getAnnouncerSnapshot`, and `ANNOUNCE_CLEAR_DELAY`. Applications can mount
   a second host. Freeze them internal.
5. **Selector leak.** Production DOM uses `data-testid="polite-announcer"` /
   `"assertive-announcer"`. Freeze `data-reference-announcer="polite" |
   "assertive"` as the contract selector.
6. **Unit tests are not AT proof.** Fake `Document` keys a WeakMap. They never
   assert `role`, `aria-live`, visually-hidden styles, MutationObserver
   insertions, or overlay exemption.

### Work order

Prove Announcer as its own runtime. Toast and ReferenceLibrary keep their
sibling titles. New proof lives in `matrix/lib/tests/e2e/announcer.spec.ts`
plus real-document Vitest for the token/pending machine.

1. **Must — API freeze** — `ANN-API-01`–`07`. Public `announce()` only.
   Untargeted routing matches ReferenceLibrary. Internals un-leaked or
   documented as non-app.
2. **Must — AT-safe DOM** — `ANN-DOM-01`–`06`. Contract selectors, two
   channels, visually hidden, not toast, text-only, not `aria-hidden`.
3. **Must — Live machine** — `ANN-LIVE-01`–`07`. Polite/assertive, repeat
   replay, blank ignore, 7s clear, same-channel last-write-wins, independent
   timers.
4. **Must — Activation / remount** — `ANN-LIFE-01`–`06`. Pending before first
   mount. Unmount resets activation so hostless work re-queues. Remount
   inserts into an already-mounted region. StrictMode does not double-speak.
5. **Must — Overlay exemption** — `ANN-OV-01`–`04`.
6. **Should — Host election** — `ANN-HOST-01`–`04` (smokes; RL owns the
   algorithm).
7. **Resilience** — `ANN-ENV-01`–`04`, `ANN-LIVE-08`, `ANN-LIFE-07`.
8. **Exotica** — `ANN-ENV-05` / `06`. Manual SR batteries stay parked.

**Stop** when every Must row is `[x]` with prose-level asserts. Do not add
`timeout`, `clearAnnouncer`, a Provider, or VoiceOver-only hacks.

### Done when

- Must rows in this file are `[x]`.
- `matrix/lib/tests/e2e/announcer.spec.ts` exists and matrix fixtures import
  only `@reference-ui/lib`.
- Sticky activation and untargeted multi-document routing are fixed, not
  documented around.
- Toast `TO-ANN-*` and RL announce smokes still pass.
- Next agent does not start a second live-region engine anywhere else.

---

## Freeze

Omitted `politeness` is `"polite"`. Omitted `document` targets the unique
eligible document. If zero documents are eligible, the call is a request-safe
no-op (pending if a known `Document` was explicit). If more than one Document
is eligible and `document` is omitted, the call is a no-op with one
development diagnostic — same freeze as Toast / `RL-ROOT-08`.

Blank messages (`trim().length === 0`) are ignored. They do not clear a
channel, record pending, or start a timer.

Polite and assertive are independent channels. They never last-write-wins
across channels.

After the host is active, a new message on the **same** channel cancels an
in-flight insert (token). The spoken result is the latest string, not a FIFO
of same-channel bursts. **Before** first activation, every non-blank call is
appended to `pending` and replayed in order after mount, with a clear-then-
insert per item and a double-`requestAnimationFrame` boundary between items
so AT can observe each mutation.

The frozen recycle delay is **7000ms** (`ANNOUNCE_CLEAR_DELAY`). There is no
per-call `timeout`. Clearing after the delay must not itself cause a second
speech (empty text is not an announcement).

Same-string repeat is a committed empty string, then the message on a later
microtask, so two AT-observable insertions occur. This converges React Aria
and Radix, rather than deduplicating equal strings.

`announce()` never creates, updates, or dismisses a toast. Toast
`{announce}` calls this function; omitting that option is silence even if the
visual card contains text.

`ReferenceLibrary` paints at most one `div[data-reference-announcer-host]`
per elected document mount. The host is a React-root child, not a `Portal`
to `document.body`. It carries `data-reference-overlay-ignore`. It is not
a descendant of `div[data-reference-toast-host]`.

Live region contract:

| Channel | Role | `aria-live` | Contract selector |
| :--- | :--- | :--- | :--- |
| polite | `status` | `polite` | `[data-reference-announcer="polite"]` |
| assertive | `alert` | `assertive` | `[data-reference-announcer="assertive"]` |

`aria-atomic="true"` is on both regions so the full message is spoken, not a
diff. The host is visually hidden (clipped 1×1) and is **not**
`aria-hidden="true"` (that would hide the regions). Regions are not tab stops.

Message text is a React text child. Markup is not interpreted.

Server imports are safe. Imperative `announce()` in Node is a no-op. The
host server-renders nothing.

`AnnouncerHost` is not application API. `getAnnouncerSnapshot` is a test
probe, not a product getter.

---

## Source evidence

- React Aria `@react-aria/live-announcer` — polite/assertive nodes, timeout
  recycle, same-string reset, `aria-atomic`, visually hidden, destroy/clear
  (leave the last two as public API).
- Radix live announcer / `announce` — document-level region, delayed
  clearing, repeat replay.
- `vendor/sonner/test/tests/basic.spec.ts` — pre-mount replay for toasts;
  extend to the separate announcer path (`TO-ANN-08`).
- Overlay `hide-outside.ts` — keep `[aria-live]`,
  `[data-reference-announcer-host]`, `[data-reference-overlay-ignore]`.
- Toast.md “Announce vs visual” — do not port Spectrum’s visual
  `aria-hidden` NVDA workaround.
- NumberField TESTS.md — shared announcements, not a private live region.

---

## Required cases

### API

- [ ] `ANN-API-01` `[reference]` `[unit]` —
  **Announcer should ignore blank messages when `announce` is called with
  empty or whitespace-only strings.** Call `announce("", {document})`,
  `announce("   ", {document})`, and `announce("\n\t", {document})` on an
  active host, then announce `"Complete"`. Assert no live-region mutation
  and no pending record for the blanks, and exactly one polite insertion of
  `"Complete"`.
- [ ] `ANN-API-02` `[reference]` `[browser]` —
  **Announcer should use the polite channel when `politeness` is omitted.**
  With one elected host, call `announce("Saved", {document})`. Assert the
  polite region receives `"Saved"` once, the assertive region stays empty,
  and no toast item is created.
- [ ] `ANN-API-03` `[reference]` `[browser]` —
  **Announcer should write only the targeted document when `document` is
  explicit.** Mount hosts in the top document and a same-origin iframe.
  Announce `"Top"` at the top `Document` and `"Frame"` at the iframe
  `Document`. Assert each live region contains only its own string and no
  node is adopted across documents.
- [ ] `ANN-API-04` `[reference]` `[browser]` —
  **Announcer should use the unique eligible document when `document` is
  omitted and one host exists.** With one mounted library, call untargeted
  `announce("Saved")`. Assert one polite insertion under that host and none
  on `document.body` outside the React root.
- [ ] `ANN-API-05` `[reference]` `[browser]` —
  **Announcer should reject ambiguous untargeted calls when multiple
  Documents are eligible.** With active hosts in the top document and an
  iframe, call targeted announces at each `Document`, then `announce("Nope")`
  with no `document`. Assert targeted calls mutate only the named host and
  the untargeted call emits one development diagnostic while mutating neither
  region. This is the `RL-ROOT-08` freeze applied to `announce()` itself.
- [ ] `ANN-API-06` `[reference]` `[ssr]` —
  **Announcer should no-op when `announce` runs without a DOM document.**
  In Node with throwing `window`/`document` getters, call `announce("Saved")`
  and `announce("Saved", {politeness: "assertive"})`. Assert no throw, no
  timer, no module-level node, and no pending store keyed to a real
  Document.
- [ ] `ANN-API-07` `[reference]` `[unit]` —
  **Announcer should not require a snapshot getter when application code
  announces.** Type-level / public-export assert: `@reference-ui/lib`
  documents `announce` and `AnnounceOptions` as the product API.
  `getAnnouncerSnapshot` and `AnnouncerHost` are not required to announce,
  and mounting `AnnouncerHost` is not part of the application contract.

### DOM

- [ ] `ANN-DOM-01` `[reference]` `[browser]` —
  **Announcer should paint one hidden host with two live regions when
  ReferenceLibrary elects a mount.** Mount one library. Assert exactly one
  `div[data-reference-announcer-host][data-reference-overlay-ignore]` in that
  React root, containing `[data-reference-announcer="polite"]` with
  `role="status"` `aria-live="polite"` `aria-atomic="true"` and
  `[data-reference-announcer="assertive"]` with `role="alert"`
  `aria-live="assertive"` `aria-atomic="true"`, and that the host is not inside
  `[data-reference-toast-host]`.
- [ ] `ANN-DOM-02` `[reference]` `[browser]` —
  **Announcer should hide the host visually without `aria-hidden` when it
  mounts.** Read computed styles on the host and both regions. Assert clipped
  1×1 absolute hiding (or equivalent sr-only), `aria-hidden` absent on host
  and regions, and that Playwright `toBeVisible()` is not the proof —
  visibility to AT is the live attributes, not a non-empty bounding box.
- [ ] `ANN-DOM-03` `[reference]` `[browser]` —
  **Announcer should keep live regions out of the tab order when the page is
  tabbed.** Mount a library plus two ordinary buttons, tab through the
  document, and assert `document.activeElement` never becomes the host or
  either region.
- [ ] `ANN-DOM-04` `[reference]` `[browser]` —
  **Announcer should treat the message as text when it contains markup.**
  Call `announce("<b>Saved</b>", {document})`. Assert the polite region’s
  `textContent` is the literal string `"<b>Saved</b>"` with no `b` element
  child and no HTML parse.
- [ ] `ANN-DOM-05` `[reference]` `[browser]` —
  **Announcer should expose stable contract selectors when testids also
  exist.** If `data-testid` aliases remain during migration, assert both
  `data-reference-announcer` and the current testids point at the same two
  nodes. New tests must use the contract selectors.
- [ ] `ANN-DOM-06` `[reference]` `[browser]` —
  **Announcer should not assign live semantics to toast or application DOM
  when it announces.** Announce `"Saved"` and show a silent toast whose
  visual text is `"Payment failed"`. Assert no `aria-live` / `role="status"`
  / `role="alert"` on the toast item wrapper, and `"Saved"` appears only in
  the polite announcer.

### Live machine

- [ ] `ANN-LIVE-01` `[reference]` `[browser]` —
  **Announcer should insert one polite message and no toast when `announce`
  is called without assertive politeness.** Observe live-region mutations
  and call `announce("Project saved", {document})`. Assert one insertion into
  the polite path, assertive empty, and zero `data-reference-toast-id`.
  Sibling: `TO-ANN-01`.
- [ ] `ANN-LIVE-02` `[reference]` `[browser]` —
  **Announcer should preserve both messages when polite and assertive
  announcements occur in the same turn.** Synchronously call polite
  `"Background sync complete"` and assertive `"Session expired"`. Assert
  each string causes one mutation in its own region and neither replaces the
  other. Sibling: `TO-ANN-02`.
- [ ] `ANN-LIVE-03` `[convergence]` `[browser]` —
  **Announcer should produce two observable mutations when the same message is
  announced twice.** Attach a `MutationObserver`, announce `"Saved"`, wait for
  its insertion boundary, and announce `"Saved"` again. Assert the region
  clears and reinserts so two distinct AT-observable insertions occur.
  Sibling: `TO-ANN-05`.
- [ ] `ANN-LIVE-04` `[reference]` `[browser]` —
  **Announcer should ignore blanks and clear old text when the recycle delay
  ends.** After `"Complete"` is inserted, advance to just before 7000ms and
  through it. Assert the string remains through the safe interval, then the
  region is emptied without a second spoken message. Sibling: `TO-ANN-07`.
- [ ] `ANN-LIVE-05` `[reference]` `[browser]` —
  **Announcer should keep only the latest same-channel message when a second
  announce wins the token before insert.** On an active host, announce
  `"First"` then immediately `"Second"` on polite. Assert the mutation log
  does not end with a committed `"First"` after `"Second"`, and the polite
  region’s settled text is `"Second"`. Assertive remains empty.
- [ ] `ANN-LIVE-06` `[reference]` `[browser]` —
  **Announcer should recycle channels independently when both have text.**
  Announce polite `"A"` and assertive `"B"`, then advance 7000ms. Assert both
  clear. In a second run, announce polite `"A"`, advance 3500ms, announce
  assertive `"B"`, then advance 3500ms. Assert polite is cleared and assertive
  still holds `"B"` until its own deadline.
- [ ] `ANN-LIVE-07` `[reference]` `[browser]` —
  **Announcer should not treat a recycle clear as a message when the delay
  fires.** Observe mutations around the 7000ms clear of `"Complete"`. Assert
  the empty text is not recorded as an announcement in application-facing
  probes and that repeating `"Complete"` after clear still produces a fresh
  insertion (clear-then-insert still required).
- [ ] `ANN-LIVE-08` `[reference]` `[unit]` —
  **Announcer should drop in-flight inserts when a newer token lands on that
  channel.** Drive the store with fake timers: announce `"A"`, then `"B"`
  before the microtask flush, then announce `"C"` after `"B"` is committed
  and before 7000ms. Assert settled polite text is `"C"` and the `"A"`
  timeout cannot resurrect `"A"`.

### Activation, pending, remount

- [ ] `ANN-LIFE-01` `[vendor]` `[browser]` —
  **Announcer should keep pending speech off-DOM when calls happen before any
  host exists.** Before a library mounts, announce `"Saved"` then `"Ready"`.
  Assert no live-region node exists, then after mount both strings are
  inserted in order into the polite path. Sibling: `TO-ANN-08` /
  `RL-LIFE-02`.
- [ ] `ANN-LIFE-02` `[reference]` `[browser]` —
  **Announcer should replay pending items into an already-mounted region when
  the host first activates.** Observe the host node identity: regions exist
  (empty) before replay inserts text. Assert no region mounts with
  pre-filled text as its first committed child, so AT can observe a mutation.
- [ ] `ANN-LIFE-03` `[reference]` `[react:all]` —
  **Announcer should speak pending work once when StrictMode replays mount
  effects.** Queue `"Ready"` before mounting a StrictMode library. Assert one
  host, one polite insertion of `"Ready"`, and no doubled mutation from
  setup-cleanup-setup.
- [ ] `ANN-LIFE-04` `[reference]` `[browser]` —
  **Announcer should re-queue hostless work after the elected host unmounts.**
  Mount, announce `"Before"`, unmount the only library, announce `"After"`,
  then mount a new library. Assert `"After"` is inserted post-mount as a
  mutation (not leftover `"Before"` as initial text, unless `"Before"` is
  still inside the 7000ms window and is re-inserted AT-safely). Sticky
  `activated === true` fails this case.
- [ ] `ANN-LIFE-05` `[reference]` `[browser]` —
  **Announcer should not lose a hostless announce that arrives during a
  ReferenceLibrary failover gap.** Reproduce `RL-LIFE-04` / `05`: unmount
  the only host, call `announce("Connection restored", {document})`, remount.
  Assert one polite insertion of `"Connection restored"` after the new host
  exists. This is the defect `RL-LIFE-05` currently claims and Announcer does
  not implement.
- [ ] `ANN-LIFE-06` `[reference]` `[browser]` —
  **Announcer should not re-speak already-cleared text when a new host
  mounts after the recycle delay.** Announce `"Old"`, unmount, advance past
  7000ms, remount. Assert the polite region mounts empty and `"Old"` is not
  inserted.
- [ ] `ANN-LIFE-07` `[reference]` `[browser]` —
  **Announcer should bound pending replay when many messages queue before
  mount.** Before mount, announce 50 distinct polite strings, then mount.
  Assert replay is ordered, finite, does not hang the UI thread, and the
  settled polite text is the last string. Freeze may cap or coalesce; if a
  cap is added, document it here before proving.

### Host election (smoke; algorithm is ReferenceLibrary)

- [ ] `ANN-HOST-01` `[reference]` `[browser]` —
  **Announcer should render under the elected React root when two libraries
  share a document.** Mount A then B. Assert one announcer host, under A,
  and `announce("Once")` mutates only A. Sibling: `RL-ROOT-01` / `02`.
- [ ] `ANN-HOST-02` `[reference]` `[browser]` —
  **Announcer should move with toast failover when the active root unmounts.**
  Announce under A, unmount A with B standing by. Assert B contains the only
  host and a subsequent `announce("Handoff")` mutates B once. Sibling:
  `RL-ROOT-03`.
- [ ] `ANN-HOST-03` `[reference]` `[shadow]` —
  **Announcer should keep host DOM inside a winning ShadowRoot.** Mount the
  elected library in an open ShadowRoot and announce for the owner document.
  Assert live regions are shadow descendants, not light-DOM body children.
  Sibling: `RL-ROOT-06`.
- [ ] `ANN-HOST-04` `[reference]` `[browser]` —
  **Announcer should not double-speak when `AnnouncerHost` is not
  application-mounted.** With an elected library, assert a second accidental
  `AnnouncerHost` is not part of the public recipe. If internals remain
  exported, a diagnostic or no-op second mount is acceptable; two live
  copies of `"Saved"` is a fail.

### Overlay exemption

- [ ] `ANN-OV-01` `[reference]` `[browser]` —
  **Announcer should remain non-inert when an isolating Overlay is open.**
  Open a default-isolating Overlay, then announce `"Saved"`. Assert the
  announcer host and both regions are not `inert`, not
  `data-overlay-managed-inert`, and not `aria-hidden="true"`, while ordinary
  siblings are isolated. Overlay `OV-INERT-05` is the toast-host seam; this
  case is the announcer node.
- [ ] `ANN-OV-02` `[reference]` `[browser]` —
  **Announcer should still receive mutations when hide-outside runs.**
  With the overlay from `ANN-OV-01` open, announce polite and assertive
  strings. Assert both insertions appear in the live regions.
- [ ] `ANN-OV-03` `[reference]` `[browser]` —
  **Announcer should not count as outside press when Overlay hit-tests
  ignore nodes.** Open Overlay, dispatch a primary pointer sequence on the
  announcer host. Assert no `onOutsidePress` / `onDismiss` from that
  sequence (`data-reference-overlay-ignore`).
- [ ] `ANN-OV-04` `[reference]` `[browser]` —
  **Announcer should stay a sibling of the toast host when both run under
  an isolating Overlay.** Show a toast and announce `"Saved"` with Overlay
  open. Assert two distinct hosts, toast not wrapping the announcer, both
  overlay-ignored, and `"Saved"` only in the announcer.

### Environment

- [ ] `ANN-ENV-01` `[reference]` `[ssr]` —
  **Announcer should emit no host markup when ReferenceLibrary server-renders.**
  `renderToString` a library with a child `<main>Hello</main>`. Assert child
  markup without announcer host / live-region attributes, and no timers.
  Sibling: `RL-ENV-01`.
- [ ] `ANN-ENV-02` `[reference]` `[ssr]` —
  **Announcer should create one client host when server markup hydrates.**
  Hydrate one library. Assert no duplicate polite/assertive regions and no
  hydration mismatch diagnostics.
- [ ] `ANN-ENV-03` `[reference]` `[browser]` —
  **Announcer should isolate stores when two Documents each have a host.**
  Same as `ANN-API-03` plus recycle timers: clearing top `"Top"` must not
  clear iframe `"Frame"`.
- [ ] `ANN-ENV-04` `[reference]` `[react:all]` —
  **Announcer should not throw when `flushSync` has no React flush target.**
  Drive replay/pending in a non-browser or detached store. Assert notify
  still runs subscribers and does not surface `flushSync` errors.
- [ ] `ANN-ENV-05` `[reference]` `[browser]` —
  **Announcer should keep speech document-local when the page is inside an
  iframe and the parent also has a library.** From inside the iframe, call
  untargeted `announce("Inner")` (one eligible document in that realm).
  Assert only the iframe host mutates.
- [ ] `ANN-ENV-06` `[reference]` `[browser]` —
  **Announcer should ignore `visibilitychange` for recycle.** Hide the tab
  during an active `"Saved"` window and restore before 7000ms. Assert the
  text is still present until the original deadline. Announcer does not copy
  Toast’s pause-on-hidden policy.

### Composition

- [ ] `ANN-COMP-01` `[reference]` `[browser]` —
  **Announcer should be the path Toast uses when `toast.show` includes
  `announce`.** Show a custom visual with `{announce: "Draft was saved"}`.
  Assert visual JSX is untouched and the exact string mutates the polite
  announcer. Sibling: `TO-ANN-03`. Toast owns the option; this is one smoke.
- [ ] `ANN-COMP-02` `[reference]` `[browser]` —
  **Announcer should stay silent when Toast omits `announce`.** Show visual
  `"Payment failed"` with no announce option. Assert no live-region mutation
  derives that text. Sibling: `TO-ANN-04`.
- [ ] `ANN-COMP-03` `[reference]` `[browser]` —
  **Announcer should remain the shared live path when a field primitive
  announces.** From a NumberField (or equivalent) fixture, trigger the
  documented shared announcement string via `announce()`. Assert that
  primitive’s DOM has no private `aria-live` and the library polite region
  received the string.
- [ ] `ANN-COMP-04` `[reference]` `[browser]` —
  **Announcer should survive microfrontend host exchange without double
  speech.** Mount roots A and B, announce `"Once"` through A, unmount A, then
  announce `"Two"` through the surviving host. Assert one insertion per
  call and never two simultaneous polite regions containing the same text.

---

## Production blockers

Full freeze text. These are the only Announcer cases that block “production”.

### Must 1 — Public routing

`ANN-API-01`–`07`. Especially `ANN-API-05` (multi-document no-op) and
internal API not being an app mount recipe.

### Must 2 — AT-safe DOM

`ANN-DOM-01`–`06`. Contract selectors, `aria-atomic`, no `aria-hidden` on the
host, text-only messages.

### Must 3 — Machine

`ANN-LIVE-01`–`07`. Repeat replay, recycle, token last-write-wins,
independent channels.

### Must 4 — Activation

`ANN-LIFE-01`–`06`. Fix sticky `activated`. Hostless gap must re-queue.
Remount must mutate, not paint initial text.

### Must 5 — Overlay

`ANN-OV-01`–`04`. Modal isolation must not eat or dismiss via the live
region.

---

## Won't do

- Per-call `timeout` / `clearAnnouncer` / `destroyAnnouncer` as public API.
- Spectrum body-singleton `LiveAnnouncer` and a required Provider.
- Putting `aria-live` on toast cards or control primitives.
- Guessing announcement text from visual JSX.
- FIFO same-channel burst after activation (token/latest wins). Pending FIFO
  is only for pre-activation.
- Pausing recycle while Overlay is open or the tab is hidden (Toast timers
  pause; live text does not).
- Real VoiceOver / NVDA / JAWS / TalkBack batteries as merge gates. Parked
  manual. Chromium MutationObserver + accessibility-tree snapshots in
  Playwright are the automated bar.
- `aria-relevant` experiments, `role="log"`, and status-only (no `alert`)
  assertive hacks until a named AT defect requires them.

---

## Implementation notes for the next agent

1. Add `matrix/lib/src/announcer.tsx` fixtures and
   `matrix/lib/tests/e2e/announcer.spec.ts`. Import only `@reference-ui/lib`.
2. Fix `activated` on last-subscriber teardown (or equivalent: always
   insert after host layout, never as initial text).
3. Route untargeted `announce()` through the same eligible-document policy
   as Toast.
4. Freeze contract attributes (`data-reference-announcer`) and migrate
   Toast / RL tests off `data-testid` as the sole selector.
5. Keep `TO-ANN-*` passing. Dual-title where one fixture asserts both proses.
6. Do not “fix” last-write-wins into a live FIFO after activation unless this
   file’s freeze is explicitly changed.
