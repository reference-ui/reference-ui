# DateField features (design backlog)

Open and deferred items that need a product, UX, or design call before any code. Each entry states the choice plainly.

### 1. Required explicit locale

**What it does:** makes `locale` mandatory so SSR markup is identical
across environments — no `navigator.language` read, ever.

**API:**

```tsx
<DateField locale="en-GB" value={v} onChange={setV} />
<DateField value={v} onChange={setV} />
// throws: [reference-ui] DateField requires an explicit locale prop.
```

Open choice: throw for all consumers vs require only when a Picker is
present vs dev-only warning as a middle step. Must be settled before any code.

**Recommendation:** Good to add with the locale engine, but the breaking change needs a decision first.

### 2. Range namespace

**What it does:** adds `DateField.Range` / `Start` / `End` — two endpoint
fields with draft buffers, focused-field pane sync, and
Apply/Cancel/Escape transactions, plus split form names — enabling
booking-style range pickers.

**API:**

```tsx
<DateField.Range
  value={{ start, end }}
  onChange={setRange}
  name={{ start: "from", end: "to" }}
>
  <DateField.Start />
  <DateField.End />
  <DateField.Picker>
    <DateField.Calendar />
  </DateField.Picker>
</DateField.Range>
```

Open choices: Apply-on-selection vs explicit Apply button for the folded
range picker; whether `canApply=false` blocks popover close or just the
commit. Each endpoint is a dirty session.

**Recommendation:** Good to add — the highest-value new surface, but only after the locale engine lands.

### 3. Constraint API

**What it does:** lets authors mark dates unavailable and enforce
`min`/`max` on typed input — complete typed dates outside bounds or
marked unavailable sit in the buffer until commit, then revert. No
min/max clamp, ever.

**API:**

```tsx
<DateField
  min="2024-01-01"
  max="2024-12-31"
  isDateUnavailable={(d) => isHoliday(d)}
/>
```

Open choice: `min > max` or non-canonical bounds fail loudly — but throw
vs dev-warning (wording and mechanism) is undecided. Gating hooks into the dirty session's publish path; the pure predicate already exists in `parse.ts`.

**Recommendation:** Good to add. The semantics are settled; pick the diagnostic and add it with the engine.

### 4. Click-to-open vs caret placement

**What it does:** resolves the conflict where click-anywhere-opens blocks
caret placement in the text — today a single click in an open field
cannot position the caret.

**API:** behavior-only, two candidate shapes: (a) the opening click also
places the caret where clicked (open + position in one gesture); (b)
first click opens, click-while-open positions the caret without toggling
closed. Typing stays immediate either way.

**Recommendation:** Good to add once option (a) or (b) is chosen against the APG combobox contract. It is a small change with real UX debt.

### 5. Accessible name for the label-less default

**What it does:** gives bare `<DateField />` (no Label, no children) a
defined accessible-name policy instead of shipping an unnamed input.

**API:** policy-only, three candidate shapes: (a) docs-only — bare usage
is author error, Label always required; (b) `placeholder` reflected as
fallback name; (c) dev-only warning when a childless input has no
`aria-label`/`aria-labelledby` and no associated Label.

**Recommendation:** Good to add as docs-only (a), unless placeholder-as-name is accepted. It is the cheapest a11y close-out.
