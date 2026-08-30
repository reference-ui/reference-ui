# Accordion tests

Playwright: `matrix/lib/tests/e2e/accordion.spec.ts`  
Page: `/accordion`

Policy over Collapsibles. Do not fork disclosure runtime.

## Unique to Accordion

| Our case | Vendor |
| --- | --- |
| `expansion="single"`: opening one closes the other; optional all-collapsed | radix `type="single"` + `collapsible`; Zag; Base UI Accordion-on-Collapsible |
| `expansion="multiple"`: `string[]` | radix `type="multiple"` |
| `keyboard="headers"`: Arrow/Home/End among triggers | radix accordion keys; Zag `GOTO.NEXT/PREV/FIRST/LAST` — implement via RovingFocus |
| `keyboard="none"`: no header roving | our API |
| Nested Collapsible keeps Trigger/Content tags | our composition |

## Combined

Presence/height → Collapsible. Roving → RovingFocus. Do not re-prove those kernels beyond Accordion policy.

## Not here

A second Collapsible implementation. Accordion.Provider.
