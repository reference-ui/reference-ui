# Tabs tests

Playwright: `matrix/lib/tests/e2e/tabs.spec.ts`  
Page: `/tabs`

RovingFocus is off for typeahead. This spec is activation policy + ARIA linking.

## Unique to Tabs

| Our case | Vendor |
| --- | --- |
| `activation="automatic"`: arrow selects | radix `activationMode`; Aria `keyboardActivation` / `selectOnFocus`; Zag `activationMode` |
| `activation="manual"`: arrow moves focus only; Space/Enter selects | same three |
| Horizontal / vertical; RTL arrows | all three |
| `aria-controls` only on the **selected** tab; panel `aria-labelledby` | Aria `useTab.ts` selected-only (not “every trigger”) |
| Disabled tab skipped | RovingFocus |
| Tab is `button`; panel hidden when inactive | our DOM |

## Combined

Keyboard kernel → `RovingFocus/TESTS.md`. Do not re-prove loop/disabled here beyond activation.

## Not here

Zag `deselectable` (nullable tab). Tabs.Provider.
