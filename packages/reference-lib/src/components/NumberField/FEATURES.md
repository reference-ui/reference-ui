# NumberField features

Items moved out of DECISIONS.md that need a genuine product, UX, or design
call before any test can pin them. Each entry sketches the API and records a
one-line maintainer take. Nothing here lands without HQ input.

## Controlled-only state + required locale (from DECISIONS candidate #1)

**What it does:** Deletes uncontrolled mode entirely — the field becomes a
fully controlled component with an explicit locale, so every rendered value
has one authority (the consumer's `value`) and one token grammar (the
required `locale`). This is the flag-day breaking release all eight PATCHES.md
freeze items (§1–§8) queue behind.

**API:**

```tsx
<NumberField
  value={value}          // number | null — required, no defaultValue
  locale="de-DE"         // string — required, no 'en-US' or env default
  onChange={setValue}
/>
// Runtime rejects NaN. ±Infinity bounds stay legal as unbounded sentinels.
```

**Maintainer take:** Good to add — one authority and one grammar is the only coherent end-state — but only as a major bump with a migration for the in-repo uncontrolled consumers (Field story, Showcase, book), and HQ must confirm required-locale-with-no-env-default is still the product call.

## Redundant onChange suppression at bounds (from DECISIONS candidate #10)

**What it does:** Stops re-firing `onChange` when a step or key press produces
no change — today Increment at max re-fires `onChange(max)` because
increment/decrement call `onChange` unconditionally after clamping. The only
unblocked behavior wart in the shipped engine; landable as a small behavior PR
with assertion-only CT titles, no rewrite needed.

**API:** No new props — pure behavior change:

```tsx
// Before: at max, Increment fires onChange(max) again (value unchanged).
// After:  at max, Increment fires nothing. Keys already no-op outward
// at boundaries per NF-KEY-01; the ruling extends that sentence to steppers.
```

**Maintainer take:** Good to add — suppressing no-change emissions at bounds is the sane contract — but HQ must rule the scope first: bounds-only, or any no-change step?
