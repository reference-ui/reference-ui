# Switch features (needs design)

Open/deferred items moved out of DECISIONS.md. Each needs a
product/UX/design call before implementation — nothing here is pinnable
until HQ (or a reporting consumer) settles the API.

### 1. Geometry-authority removal: `data-state`-only thumb styling (from DECISIONS candidate #2)

- **What it does:** Removes Switch's inline thumb `transform`/`transition` so all thumb travel is app-owned CSS against `data-state="checked" | "unchecked"` (including RTL); Switch publishes no geometry.
- **API:** No new props — the styling contract becomes `data-state`-only. Open: do default-thumb consumers get a documented CSS travel recipe?
- **Maintainer take:** Only as a designed restyle arc with fresh snapshots — never as a silent strip of the shipped 200ms slide.
- **TAIL (2026-09-28, finish-line P2C):** proceeded on the maintainer-take — the inline transform/transition is blessed as the shipped styling contract (no strip, no restyle, all 7 snapshots byte-identical). HQ walkthrough to confirm the blessing or commission the restyle arc.

### 2. Managed-prop type Omit (from DECISIONS candidate #4)

- **What it does:** Hides `aria-checked`/`aria-pressed` (with `onChange`/`type`/`role`) from public Root types so the managed ARIA contract is enforced at compile time, matching the landed runtime strip.
- **API:** `SwitchProps = Omit<..., 'onChange' | 'type' | 'role' | 'aria-checked' | 'aria-pressed'>`. Open: error or silent Omit for current passers? Extend to `data-state`/`data-disabled`?
- **Maintainer take:** Good to add, but only as one coherent breaking-type story in the next intentional type-surface pass.
- **Landed (features campaign 2026-09-26):** silent Omit extended to `'aria-checked' | 'aria-pressed' | 'data-state' | 'data-disabled'` in one breaking-type pass; pinned by `SW-TYPE-01` (`@ts-expect-error` on the aria keys; `data-*` unpinnable — TS permits all `data-*` JSX attributes, runtime managed-wins still enforced by `SW-DOM-02`).

### 3. Clipped extra children vs the accessible name (from DECISIONS gap #1)

- **What it does:** Resolves the leak where visually clipped extra children still surface in the switch's accessible name (live tree reads `switch "Extra Visual"` while the track clips that child).
- **API:** No new API by default — HQ picks one: doc note ("extras are clipped; keep them decorative and `aria-hidden`"), behavior fix (name computation excludes clipped descendants), or dev warning on text-bearing non-Thumb children.
- **Maintainer take:** Worth settling at walkthrough; start with the doc note and build the guard only if a consumer proves harm.
- **Landed (features campaign 2026-09-26):** doc note in `Switch.md` ("keep extras decorative and `aria-hidden`"). No guard — no consumer has proven harm.

### 4. Ref or handle to the default thumb (from DECISIONS gap #2)

- **What it does:** Gives low-specificity consumers a node handle to the rendered default thumb `span` for measurement or animation, without taking on authored-Thumb styling.
- **API:** One of: `thumbRef?: Ref<HTMLElement>` prop on Root, a `Switch.useThumb()` accessor, or no API — document "author `Switch.Thumb` when you need the node" as the complete answer.
- **Maintainer take:** Don't add until a consumer proves measurement/animation need — "author a Thumb" is the working answer today.
- **HQ 2026-09-26:** Unsure — weird-use-case smell. HOLD for HQ walkthrough, do not implement.

### 5. `onChange` event access (from DECISIONS gap #3)

- **What it does:** Gives consumers event context (modifier keys, timestamps, propagation) at request time, beyond today's boolean-only `onChange(checked)`.
- **API:** Either keep boolean-only and bless the `onClick` + `onChange` pairing (`SW-ACT-05` pattern) as the event channel, or widen to `onChange(checked, event)` / a single request object.
- **Maintainer take:** Don't widen on a hypothetical — bless the `onClick` pairing unless a consumer shows it insufficient.
- **HQ 2026-09-26:** Approved — implement event access as widened `onChange(checked, event)`.
- **Landed (features campaign 2026-09-26):** `onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void`; the click (incl. Space/Enter/thumb clicks) is passed through. Single-arg handlers keep working.
