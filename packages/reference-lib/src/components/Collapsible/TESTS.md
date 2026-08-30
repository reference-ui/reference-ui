# Collapsible tests

Playwright: `matrix/lib/tests/e2e/collapsible.spec.ts`  
Page: `/collapsible`

## Unique to Collapsible

| Our case | Vendor |
| --- | --- |
| Controlled `open`; trigger `aria-expanded` / `aria-controls` | radix collapsible; Zag; Ariakit `disclosure.ts` |
| Content stays mounted through exit (Presence / `data-state`) | radix Presence + height measure CSS vars — we map to Presence, leave `--radix-*` names |
| Keyboard: trigger is `button` (Space/Enter) | native |
| Nested in Accordion: do not pass `open`; id drives expansion | Accordion composition — assert on Accordion page too |

## Combined

Height animation is Presence. Accordion single/multiple → `Accordion/TESTS.md`.

## Not here

Uncontrolled-only `<details>` as the primitive. Accordion keyboard among headers (Accordion).
