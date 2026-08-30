# FocusLock tests

Playwright: `matrix/lib/tests/e2e/focus-lock.spec.ts`  
Page: `/focus-lock`

Overlay already proves trap + restore-after-Presence + removed focused node (`Overlay/TESTS.md`). This spec is the solver without dialog chrome: shards, `initialFocus`, tabbable catalog. Do not stand up a second Overlay suite.

## Unique to FocusLock

| Our case | Vendor |
| --- | --- |
| Tab loops first ↔ last; no wrapper node in the DOM | Aria FocusScope / focus-trap Tab intercept; radix `focus-guards` — our lock slots onto the child |
| `initialFocus` omitted → first tabbable; ref → that node; `false` → no move | focus-trap `initialFocus === false`. **Not** react-focus-lock `autoFocus={false}` (blurs to body) |
| Shards: focus in a node outside the child DOM is allowed | react-focus-lock `shards`; radix FocusScope `branches` (#3423) |
| Restore uses proximity if the previously focused node is gone | `vendor/focus-lock/src/return-focus.ts`; `return-focus.spec.ts` |
| Radio group is one tab stop | tabbable `isTabbableRadio`; focus-lock `correctFocus.ts` / `focusMerge.unit.spec.ts` radios |
| Disabled fieldset, closed `details`, `inert`, `contenteditable="false"` skipped | `vendor/tabbable/test` unit + `test/e2e/tabbable.cy.js`, `shadow-dom.cy.js` |
| `relatedTarget === null` does not CPU-spin reclaim | radix focus-scope |
| Nested lock: lower lock pauses | radix `focusScopesStack`; focus-trap `trapStack` |
| Shadow / slot tabbables | tabbable `shadow-dom.cy.js`; focus-lock `shadow-dom.spec.ts`; focus-trap `shadowDom.test.js` |

## Combined

Dialog trap + Presence restore stay on Overlay. This page may mount a portalled sibling as a shard **without** Overlay, so FocusLock can freeze first.

## Not here

`as` / wrapper guards as required DOM. Iframe/`crossFrame` until Overlay documents iframes. Ariakit FocusTrapRegion as the lock. Combining focus-lock **and** a second trap library (fighting).
