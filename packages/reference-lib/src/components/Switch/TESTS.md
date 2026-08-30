# Switch tests

Playwright: `matrix/lib/tests/e2e/switch.spec.ts`  
Page: `/switch`

Deliberately small. Wrong DOM is the bug.

## Unique to Switch

| Our case | Vendor |
| --- | --- |
| Renders `button`; `role="switch"`; `aria-checked` follows controlled `checked` | radix `switch.tsx` |
| Space/Enter toggles; `onChange(boolean)` | native button |
| Does **not** render a hidden checkbox | Aria `useSwitch` — **contrast** |
| Native button attrs still work (`disabled`, `aria-labelledby`) | our API |

## Not here

Form `name` / reset bubble input (radix/Zag). Checkbox/radio wrappers (`components.md` omissions).
