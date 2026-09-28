# Menu patches (mechanical follow-ups)

Status: companion to DECISIONS.md — every item here is fully specified; a test could pin it today. Blockers are other landings, not design decisions.

### 1. Intent timer wiring (hover 100ms / close 300ms / 5px grace) (from DECISIONS candidate #4) — DONE (P2E)

- **What:** Wire the landed-but-unwired `menu-intent.ts` hover/open/close timers onto nested submenus (no new public props).
- **Acceptance:** `MN-INTENT-01..08` e2e pass; `menu-intent.test.ts` (`MN-INTENT-09`) stays green. ~~Blocked on FEATURES.md nested submenus.~~
- **Source:** quarantine `42b1a2c35` `menu-intent.ts` (+221, verbatim, unexported); `matrix/lib/tests/e2e/menu.spec.ts` pointer matrix; TESTS.md decision 5 freezes 100/300/5px.
- **Proof:** CT `MN-INTENT-01..08` + unit `MN-INTENT-09`, React 17/18/19 green. Plus P2E hardening: descendant-aware travel, once-per-episode rejected close, resolved-side grace.

### 2. Space-as-search during active typeahead buffer (from DECISIONS candidate #8) — STILL BLOCKED

- **What:** While a typeahead buffer is active, Space extends the search (no `onSelect`/`onOpen`); after buffer timeout, Space activates once as today.
- **Acceptance:** `MN-TYPE-02` e2e passes with `MN-TYPE-01/04` still green. Blocked on the RovingFocus crew's typeahead-session gate (Listbox shares it).
- **Source:** quarantine `42b1a2c35` `matrix/lib/tests/e2e/menu.spec.ts` (Base UI typeahead-vs-Space regression); log SKIP TYPE-02.
- **P2E note:** verified still absent (no session API in RovingFocus). Menu-side buffer tracking would fork RovingFocus behavior against TESTS `MN-TYPE-04` ("must not fork") — left for the owning crew.

### 3. Shadow DOM composed-path ownership (from DECISIONS candidate #10) — DONE

- **What:** Adopt lib-wide ShadowRoot semantics: composed inside paths never dismiss, actual outside paths dismiss once, focus/search use the owning root, branches/layers clean up.
- **Acceptance:** `MN-ENV-03` e2e passes (ShadowRoot mount, composed inside/outside paths, portal branch/layer cleanup). ~~Blocked on the Overlay crew defining ownership once for all consumers.~~
- **Source:** quarantine `42b1a2c35` `matrix/lib/tests/e2e/menu.spec.ts`; SPEC.md cites Tree/Switch precedent; log SKIP ENV-03.
- **Proof:** CT `MN-ENV-03` green on React 17/18/19 (P1.2 shadow-ownership joint: Portal owns placement/delivery, Overlay the destination rule, Menu composed-path usage + owning-root focus).
