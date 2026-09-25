# Announcer test contract

Driver: [SPEC.md](./SPEC.md). This file is the case catalog (setup / action / assert). `[x]` here means the case is **specified**. Proof is `[x]` in SPEC.md only when a passing test title contains the ID.

Playwright: `matrix/lib/tests/e2e/announcer.spec.ts`
Unit: `matrix/lib/tests/unit/announcer.test.ts` & `packages/reference-lib/src/components/Announcer/Announcer.test.ts`
Page: `/announcer`

## Required cases

### API

- [x] `ANN-API-01` `[reference]` `[unit]` —
  **Announcer should ignore blank messages when `announce` is called with
  empty or whitespace-only strings.** Call `announce("", {document})`,
  `announce("   ", {document})`, and `announce("\n\t", {document})` on an
  active host, then announce `"Complete"`. Assert no live-region mutation
  and no pending record for the blanks, and exactly one polite insertion of
  `"Complete"`.
- [x] `ANN-API-02` `[reference]` `[browser]` —
  **Announcer should use the polite channel when `politeness` is omitted.**
  With one elected host, call `announce("Saved", {document})`. Assert the
  polite region receives `"Saved"` once, the assertive region stays empty,
  and no toast item is created.
- [x] `ANN-API-03` `[reference]` `[browser]` —
  **Announcer should write only the targeted document when `document` is
  explicit.** Mount hosts in the top document and a same-origin iframe.
  Announce `"Top"` at the top `Document` and `"Frame"` at the iframe
  `Document`. Assert each live region contains only its own string and no
  node is adopted across documents.
- [x] `ANN-API-04` `[reference]` `[browser]` —
  **Announcer should use the unique eligible document when `document` is
  omitted and one host exists.** With one mounted library, call untargeted
  `announce("Saved")`. Assert one polite insertion under that host and none
  on `document.body` outside the React root.
- [x] `ANN-API-05` `[reference]` `[browser]` —
  **Announcer should reject ambiguous untargeted calls when multiple
  Documents are eligible.** With active hosts in the top document and an
  iframe, call targeted announces at each `Document`, then `announce("Nope")`
  with no `document`. Assert targeted calls mutate only the named host and
  the untargeted call emits one development diagnostic while mutating neither
  region. This is the `RL-ROOT-08` freeze applied to `announce()` itself.
- [x] `ANN-API-06` `[reference]` `[ssr]` —
  **Announcer should no-op when `announce` runs without a DOM document.**
  In Node with throwing `window`/`document` getters, call `announce("Saved")`
  and `announce("Saved", {politeness: "assertive"})`. Assert no throw, no
  timer, no module-level node, and no pending store keyed to a real
  Document.
- [x] `ANN-API-07` `[reference]` `[unit]` —
  **Announcer should not require a snapshot getter when application code
  announces.** Type-level / public-export assert: `@reference-ui/lib`
  documents `announce` and `AnnounceOptions` as the product API.
  `getAnnouncerSnapshot` and `AnnouncerHost` are not required to announce,
  and mounting `AnnouncerHost` is not part of the application contract.

### DOM

- [x] `ANN-DOM-01` `[reference]` `[browser]` —
  **Announcer should paint one hidden host with two live regions when
  ReferenceLibrary elects a mount.** Mount one library. Assert exactly one
  `div[data-reference-announcer-host][data-reference-overlay-ignore]` in that
  React root, containing `[data-reference-announcer="polite"]` with
  `role="status"` `aria-live="polite"` `aria-atomic="true"` and
  `[data-reference-announcer="assertive"]` with `role="alert"`
  `aria-live="assertive"` `aria-atomic="true"`, and that the host is not inside
  `[data-reference-toast-host]`.
- [x] `ANN-DOM-02` `[reference]` `[browser]` —
  **Announcer should hide the host visually without `aria-hidden` when it
  mounts.** Read computed styles on the host and both regions. Assert clipped
  1×1 absolute hiding (or equivalent sr-only), `aria-hidden` absent on host
  and regions, and that Playwright `toBeVisible()` is not the proof —
  visibility to AT is the live attributes, not a non-empty bounding box.
- [x] `ANN-DOM-03` `[reference]` `[browser]` —
  **Announcer should keep live regions out of the tab order when the page is
  tabbed.** Mount a library plus two ordinary buttons, tab through the
  document, and assert `document.activeElement` never becomes the host or
  either region.
- [x] `ANN-DOM-04` `[reference]` `[browser]` —
  **Announcer should treat the message as text when it contains markup.**
  Call `announce("<b>Saved</b>", {document})`. Assert the polite region’s
  `textContent` is the literal string `"<b>Saved</b>"` with no `b` element
  child and no HTML parse.
- [x] `ANN-DOM-05` `[reference]` `[browser]` —
  **Announcer should expose stable contract selectors when testids also
  exist.** If `data-testid` aliases remain during migration, assert both
  `data-reference-announcer` and the current testids point at the same two
  nodes. New tests must use the contract selectors.
- [x] `ANN-DOM-06` `[reference]` `[browser]` —
  **Announcer should not assign live semantics to toast or application DOM
  when it announces.** Announce `"Saved"` and show a silent toast whose
  visual text is `"Payment failed"`. Assert no `aria-live` / `role="status"`
  / `role="alert"` on the toast item wrapper, and `"Saved"` appears only in
  the polite announcer.

### Live machine

- [x] `ANN-LIVE-01` `[reference]` `[browser]` —
  **Announcer should insert one polite message and no toast when `announce`
  is called without assertive politeness.** Observe live-region mutations
  and call `announce("Project saved", {document})`. Assert one insertion into
  the polite path, assertive empty, and zero `data-reference-toast-id`.
  Sibling: `TO-ANN-01`.
- [x] `ANN-LIVE-02` `[reference]` `[browser]` —
  **Announcer should preserve both messages when polite and assertive
  announcements occur in the same turn.** Synchronously call polite
  `"Background sync complete"` and assertive `"Session expired"`. Assert
  each string causes one mutation in its own region and neither replaces the
  other. Sibling: `TO-ANN-02`.
- [x] `ANN-LIVE-03` `[convergence]` `[browser]` —
  **Announcer should produce two observable mutations when the same message is
  announced twice.** Attach a `MutationObserver`, announce `"Saved"`, wait for
  its insertion boundary, and announce `"Saved"` again. Assert the region
  clears and reinserts so two distinct AT-observable insertions occur.
  Sibling: `TO-ANN-05`.
- [x] `ANN-LIVE-04` `[reference]` `[browser]` —
  **Announcer should ignore blanks and clear old text when the recycle delay
  ends.** After `"Complete"` is inserted, advance to just before 7000ms and
  through it. Assert the string remains through the safe interval, then the
  region is emptied without a second spoken message. Sibling: `TO-ANN-07`.
- [x] `ANN-LIVE-05` `[reference]` `[browser]` —
  **Announcer should keep only the latest same-channel message when a second
  announce wins the token before insert.** On an active host, announce
  `"First"` then immediately `"Second"` on polite. Assert the mutation log
  does not end with a committed `"First"` after `"Second"`, and the polite
  region’s settled text is `"Second"`. Assertive remains empty.
- [x] `ANN-LIVE-06` `[reference]` `[browser]` —
  **Announcer should recycle channels independently when both have text.**
  Announce polite `"A"` and assertive `"B"`, then advance 7000ms. Assert both
  clear. In a second run, announce polite `"A"`, advance 3500ms, announce
  assertive `"B"`, then advance 3500ms. Assert polite is cleared and assertive
  still holds `"B"` until its own deadline.
- [x] `ANN-LIVE-07` `[reference]` `[browser]` —
  **Announcer should not treat a recycle clear as a message when the delay
  fires.** Observe mutations around the 7000ms clear of `"Complete"`. Assert
  the empty text is not recorded as an announcement in application-facing
  probes and that repeating `"Complete"` after clear still produces a fresh
  insertion (clear-then-insert still required).
- [x] `ANN-LIVE-08` `[reference]` `[unit]` —
  **Announcer should drop in-flight inserts when a newer token lands on that
  channel.** Drive the store with fake timers: announce `"A"`, then `"B"`
  before the microtask flush, then announce `"C"` after `"B"` is committed
  and before 7000ms. Assert settled polite text is `"C"` and the `"A"`
  timeout cannot resurrect `"A"`.

### Activation, pending, remount

- [x] `ANN-LIFE-01` `[vendor]` `[browser]` —
  **Announcer should keep pending speech off-DOM when calls happen before any
  host exists.** Before a library mounts, announce `"Saved"` then `"Ready"`.
  Assert no live-region node exists, then after mount both strings are
  inserted in order into the polite path. Sibling: `TO-ANN-08` /
  `RL-LIFE-02`.
- [x] `ANN-LIFE-02` `[reference]` `[browser]` —
  **Announcer should replay pending items into an already-mounted region when
  the host first activates.** Observe the host node identity: regions exist
  (empty) before replay inserts text. Assert no region mounts with
  pre-filled text as its first committed child, so AT can observe a mutation.
- [x] `ANN-LIFE-03` `[reference]` `[react:all]` —
  **Announcer should speak pending work once when StrictMode replays mount
  effects.** Queue `"Ready"` before mounting a StrictMode library. Assert one
  host, one polite insertion of `"Ready"`, and no doubled mutation from
  setup-cleanup-setup.
- [x] `ANN-LIFE-04` `[reference]` `[browser]` —
  **Announcer should re-queue hostless work after the elected host unmounts.**
  Mount, announce `"Before"`, unmount the only library, announce `"After"`,
  then mount a new library. Assert `"After"` is inserted post-mount as a
  mutation (not leftover `"Before"` as initial text, unless `"Before"` is
  still inside the 7000ms window and is re-inserted AT-safely). Sticky
  `activated === true` fails this case.
- [x] `ANN-LIFE-05` `[reference]` `[browser]` —
  **Announcer should not lose a hostless announce that arrives during a
  ReferenceLibrary failover gap.** Reproduce `RL-LIFE-04` / `05`: unmount
  the only host, call `announce("Connection restored", {document})`, remount.
  Assert one polite insertion of `"Connection restored"` after the new host
  exists. This is the defect `RL-LIFE-05` currently claims and Announcer does
  not implement.
- [x] `ANN-LIFE-06` `[reference]` `[browser]` —
  **Announcer should not re-speak already-cleared text when a new host
  mounts after the recycle delay.** Announce `"Old"`, unmount, advance past
  7000ms, remount. Assert the polite region mounts empty and `"Old"` is not
  inserted.
- [x] `ANN-LIFE-07` `[reference]` `[browser]` —
  **Announcer should bound pending replay when many messages queue before
  mount.** Before mount, announce 50 distinct polite strings, then mount.
  Assert replay is ordered, finite, does not hang the UI thread, and the
  settled polite text is the last string.

### Host election

- [x] `ANN-HOST-01` `[reference]` `[browser]` —
  **Announcer should render under the elected React root when two libraries
  share a document.** Mount A then B. Assert one announcer host, under A,
  and `announce("Once")` mutates only A. Sibling: `RL-ROOT-01` / `02`.
- [x] `ANN-HOST-02` `[reference]` `[browser]` —
  **Announcer should move with toast failover when the active root unmounts.**
  Announce under A, unmount A with B standing by. Assert B contains the only
  host and a subsequent `announce("Handoff")` mutates B once. Sibling:
  `RL-ROOT-03`.
- [x] `ANN-HOST-03` `[reference]` `[shadow]` —
  **Announcer should keep host DOM inside a winning ShadowRoot.** Mount the
  elected library in an open ShadowRoot and announce for the owner document.
  Assert live regions are shadow descendants, not light-DOM body children.
  Sibling: `RL-ROOT-06`.
- [x] `ANN-HOST-04` `[reference]` `[browser]` —
  **Announcer should not double-speak when `AnnouncerHost` is not
  application-mounted.** With an elected library, assert a second accidental
  `AnnouncerHost` is not part of the public recipe. If internals remain
  exported, a diagnostic or no-op second mount is acceptable; two live
  copies of `"Saved"` is a fail.

### Overlay exemption

- [x] `ANN-OV-01` `[reference]` `[browser]` —
  **Announcer should remain non-inert when an isolating Overlay is open.**
  Open a default-isolating Overlay, then announce `"Saved"`. Assert the
  announcer host and both regions are not `inert`, not
  `data-overlay-managed-inert`, and not `aria-hidden="true"`, while ordinary
  siblings are isolated.
- [x] `ANN-OV-02` `[reference]` `[browser]` —
  **Announcer should still receive mutations when hide-outside runs.**
  With the overlay from `ANN-OV-01` open, announce polite and assertive
  strings. Assert both insertions appear in the live regions.
- [x] `ANN-OV-03` `[reference]` `[browser]` —
  **Announcer should not count as outside press when Overlay hit-tests
  ignore nodes.** Open Overlay, dispatch a primary pointer sequence on the
  announcer host. Assert no `onOutsidePress` / `onDismiss` from that
  sequence (`data-reference-overlay-ignore`).
- [x] `ANN-OV-04` `[reference]` `[browser]` —
  **Announcer should stay a sibling of the toast host when both run under
  an isolating Overlay.** Show a toast and announce `"Saved"` with Overlay
  open. Assert two distinct hosts, toast not wrapping the announcer, both
  overlay-ignored, and `"Saved"` only in the announcer.

### Environment

- [x] `ANN-ENV-01` `[reference]` `[ssr]` —
  **Announcer should emit no host markup when ReferenceLibrary server-renders.**
  `renderToString` a library with a child `<main>Hello</main>`. Assert child
  markup without announcer host / live-region attributes, and no timers.
- [x] `ANN-ENV-02` `[reference]` `[ssr]` —
  **Announcer should create one client host when server markup hydrates.**
  Hydrate one library. Assert no duplicate polite/assertive regions and no
  hydration mismatch diagnostics.
- [x] `ANN-ENV-03` `[reference]` `[browser]` —
  **Announcer should isolate stores when two Documents each have a host.**
  Same as `ANN-API-03` plus recycle timers: clearing top `"Top"` must not
  clear iframe `"Frame"`.
- [x] `ANN-ENV-04` `[reference]` `[react:all]` —
  **Announcer should not throw when `flushSync` has no React flush target.**
  Drive replay/pending in a non-browser or detached store. Assert notify
  still runs subscribers and does not surface `flushSync` errors.
- [x] `ANN-ENV-05` `[reference]` `[browser]` —
  **Announcer should keep speech document-local when the page is inside an
  iframe and the parent also has a library.** From inside the iframe, call
  untargeted `announce("Inner")` (one eligible document in that realm).
  Assert only the iframe host mutates.
- [x] `ANN-ENV-06` `[reference]` `[browser]` —
  **Announcer should ignore `visibilitychange` for recycle.** Hide the tab
  during an active `"Saved"` window and restore before 7000ms. Assert the
  text is still present until the original deadline.

### Composition

- [x] `ANN-COMP-01` `[reference]` `[browser]` —
  **Announcer should be the path Toast uses when `toast.show` includes
  `announce`.** Show a custom visual with `{announce: "Draft was saved"}`.
  Assert visual JSX is untouched and the exact string mutates the polite
  announcer. Sibling: `TO-ANN-03`.
- [x] `ANN-COMP-02` `[reference]` `[browser]` —
  **Announcer should stay silent when Toast omits `announce`.** Show visual
  `"Payment failed"` with no announce option. Assert no live-region mutation
  derives that text. Sibling: `TO-ANN-04`.
- [x] `ANN-COMP-03` `[reference]` `[browser]` —
  **Announcer should remain the shared live path when a field primitive
  announces.** From a NumberField (or equivalent) fixture, trigger the
  documented shared announcement string via `announce()`. Assert that
  primitive’s DOM has no private `aria-live` and the library polite region
  received the string.
- [x] `ANN-COMP-04` `[reference]` `[browser]` —
  **Announcer should survive microfrontend host exchange without double
  speech.** Mount roots A and B, announce `"Once"` through A, unmount A, then
  announce `"Two"` through the surviving host. Assert one insertion per
  call and never two simultaneous polite regions containing the same text.
