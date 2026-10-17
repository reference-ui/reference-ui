# Switch features (needs design)

Open and deferred items. Each needs a product, UX, or design call before implementation; nothing here is pinnable until the API is settled.

### 1. Geometry-authority removal: `data-state`-only thumb styling

- **What it does:** Removes Switch's inline thumb `transform`/`transition` so all thumb travel is app-owned CSS against `data-state="checked" | "unchecked"` (including RTL); Switch publishes no geometry.
- **API:** No new props — the styling contract becomes `data-state`-only. Open: do default-thumb consumers get a documented CSS travel recipe?
- **Recommendation:** Only as a designed restyle arc with fresh snapshots — never as a silent strip of the shipped 200ms slide.
- **Current state:** the inline `transform`/`transition` on the thumb is the shipped styling contract. It is not stripped or restyled, and the 200ms slide is unchanged.

### 2. Managed-prop type Omit

- **What it does:** Hides `aria-checked`/`aria-pressed` (with `onChange`/`type`/`role`) from public Root types so the managed ARIA contract is enforced at compile time, matching the runtime strip.
- **API:** `SwitchProps = Omit<..., 'onChange' | 'type' | 'role' | 'aria-checked' | 'aria-pressed'>`.
- **Recommendation:** Good to add, but only as one coherent breaking-type story in the next intentional type-surface pass.
- **Implemented:** the silent Omit covers `'aria-checked' | 'aria-pressed' | 'data-state' | 'data-disabled'` in one breaking-type pass; pinned by `SW-TYPE-01` (`@ts-expect-error` on the aria keys; `data-*` unpinnable — TS permits all `data-*` JSX attributes, runtime managed-wins still enforced by `SW-DOM-02`).

### 3. Clipped extra children vs the accessible name

- **What it does:** Resolves the leak where visually clipped extra children still surface in the switch's accessible name (live tree reads `switch "Extra Visual"` while the track clips that child).
- **API:** No new API by default. The options are a doc note ("extras are clipped; keep them decorative and `aria-hidden`"), behavior fix (name computation excludes clipped descendants), or dev warning on text-bearing non-Thumb children.
- **Recommendation:** Start with the doc note, and build the guard only if a consumer proves harm.
- **Implemented:** a doc note in `Switch.md` ("keep extras decorative and `aria-hidden`"). No guard; no consumer has proven harm.

### 4. Ref or handle to the default thumb

- **What it does:** Gives low-specificity consumers a node handle to the rendered default thumb `span` for measurement or animation, without taking on authored-Thumb styling.
- **API:** One of: `thumbRef?: Ref<HTMLElement>` prop on Root, a `Switch.useThumb()` accessor, or no API — document "author `Switch.Thumb` when you need the node" as the complete answer.
- **Recommendation:** Don't add until a consumer proves measurement/animation need — "author a Thumb" is the current answer.

### 5. `onChange` event access

- **What it does:** Gives consumers event context (modifier keys, timestamps, propagation) at request time, beyond today's boolean-only `onChange(checked)`.
- **API:** Either keep boolean-only and document the `onClick` + `onChange` pairing (`SW-ACT-05` pattern) as the event channel, or widen to `onChange(checked, event)` / a single request object.
- **Recommendation:** Don't widen on a hypothetical; use the `onClick` pairing unless a consumer shows it insufficient.
- **Implemented:** `onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void`; the click (incl. Space/Enter/thumb clicks) is passed through. Single-arg handlers keep working.
