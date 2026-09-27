# Showcase spinbutton-fix crew — mission log

Status: COMPLETE

## Brief
- Scope: ONLY `packages/reference-lib/src/components/Showcase/__e2e__/Showcase.ct.spec.ts`
- Context: NumberField B-26 removed `role="spinbutton"` (plain textbox now); line 58 `getByRole('spinbutton')` fails.
- Fix: re-query as scoped textbox, assert same `'43'` value.

## Findings
- Showcase.book.tsx NumberField.Input has no accessible name (no aria-label, no placeholder), so `getByRole('textbox', { name })` is not possible.
- Page has multiple textboxes (Field inputs, Combobox, etc.) — must scope.
- NumberField root renders `role="group"` + `data-reference-number-field=""` (NumberField.tsx:976-978) — stable scope hook.

## Change
- Line 58: `await expect(component.getByRole('spinbutton')).toHaveValue('43')`
  → `const stepper = component.locator('[data-reference-number-field]')` +
  `await expect(stepper.getByRole('textbox')).toHaveValue('43')`
- No accessible name on NumberField.Input, so named query impossible; scoped to stepper root instead.

## Verification
- `pnpm agentct Showcase --e2e` (React 19): E2E: 3 | Passed: 3 | Failed: 0 — green.
