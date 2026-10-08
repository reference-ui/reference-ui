# RovingFocus features — need design before landing

Companion to `DECISIONS.md`. Every item here needs a product, UX, or
API-design call from HQ before anyone implements it. Titles keep their
`DECISIONS.md` numbering in the source pointer.

## 1. Visual 2D grid navigation for `orientation="both"`

Source: `DECISIONS.md` candidate 1 (DEFERRED).

**What it does:** turns `orientation="both"` from "1D with both arrow axes"
into measured visual geometry — Up/Down move to the adjacent row's
nearest-horizontal-center item, Left/Right stay in-row, ragged rows supported,
DOM-order tie-break, rects re-read per keystroke (no cached grid).

**API:** no new props. Behavior change under the existing prop:

```tsx
<RovingFocus orientation="both">
  <RovingFocusItem>…</RovingFocusItem>
  {/* ragged rows resolve by measured centers, not DOM order */}
</RovingFocus>
```

Open design: nearest-center vs DOM-order-column for vertical moves in sparse
last rows; whether rect measurement caches within a keypress burst.

**Maintainer take:** worth adding once a real grid consumer exists to prove the row-grouping heuristics against — not before.

## 2. Transparent slot contract (`ReferenceSlotPartProps` + StyleProps)

Source: `DECISIONS.md` candidate 2 (DEFERRED).

**What it does:** makes Root and Item transparent — no host nodes. Each takes
exactly one child element; token-aware StyleProps are split out, compiled
with `css()`, and merged (className, style, ref, handlers) onto that child.

**API:**

```tsx
interface RovingFocusProps extends ReferenceSlotPartProps { /* + kernel props */ }
interface RovingFocusItemProps extends ReferenceSlotPartProps { /* + item props */ }

// children: exactly one element; StyleProps merge onto it, zero wrapper nodes
<RovingFocus padding="4">
  <div>{/* receives merged className/style/ref/handlers */}</div>
</RovingFocus>
```

Open design: HQ must confirm transparent-slot as the catalog-wide primitive
shape, and decide who owns the merge helper (Slot?).

**Maintainer take:** the right end-state, but only on top of the real Slot/PART conformance story — never as another per-component merge fork.

## 3. Runtime single-element anatomy error (incl. Fragment rejection)

Source: `DECISIONS.md` candidate 3 (DEFERRED).

**What it does:** Root and Item throw a descriptive single-element anatomy
error at render for omitted, `null`, `false`, text, number, Fragment, or
multi-element children, with no partial registration. (Landed code already
rejects non-elements; the delta is explicit Fragment and multi-element
rejection.)

**API:** no new props — render-time behavior:

```tsx
<RovingFocus>{/* Fragment, text, or two elements → throws, DOM untouched */}</RovingFocus>
```

Open design: throw vs dev-only warning — a throw matches RF-DOM-06 as
specified, a warning is kinder during consumer migration; HQ call.

**Maintainer take:** throw is correct long-term, but only after the Listbox/Menu/Tabs/Tree consumer audit — warn while migrating.

## 4. Pointer press sets current item

Source: `DECISIONS.md` candidate 5 (DEFERRED).

**What it does:** clicking/tapping an Item makes it the current (`tabIndex=0`)
item, so Tab-out-and-back re-enters on the clicked item — covering presses
that never move DOM focus and therefore never hit today's focus handler.

**API:** no new props — new interaction behavior on Item press.

Open design: should pointer-press also move DOM focus to the item, or only
update currentness and leave focus where the browser put it? Either satisfies
RF-TAB-04, but the feel differs — plus Menu's click-open focus-parking policy
must be reconciled first.

**Maintainer take:** good to add once Menu confirms its click-open policy — currentness-only, no focus steal.

## 5. Controlled current-id API: keep vs strip to freeze

Source: `DECISIONS.md` candidate 6 (OPEN).

**What it does:** resolves the one breaking public-API fork. Either strip the
controlled props per the SPEC freeze (currentness fully internal), or keep
and document controlled/uncontrolled semantics with a named freeze amendment.

**API:** two directions, HQ picks one:

```tsx
// (a) Strip — delete all three; currentness is internal-only
// (b) Keep + document:
// currentId?: string; defaultCurrentId?: string; onCurrentIdChange?: (id: string) => void
<RovingFocus currentId={id} onCurrentIdChange={setId} />
```

Open design: does any consumer (present or planned) need controlled
currentness — Menu restoring focus to a trigger-adjacent item, Tabs syncing
currentness with selection? If none can name a use, strip.

**Maintainer take:** keep only if a consumer names a real use, otherwise strip per the freeze — but decide before consumer migration starts.

## 6. Shadow-DOM navigation (composed order + deep active element)

Source: `DECISIONS.md` suspected gap 1 (DEFERRED).

**What it does:** registration order, focus tracking, and currentness follow
composed shadow order; the deepest shadow active element is recognized;
exactly one shadow child holds `tabIndex=0` (RF-ENV-02, specified but unproven
everywhere).

**API:** no new props — kernel follows composed order transparently.

Open design: is shadow support in-scope for reference-ui at all, or should
RF-ENV-02 be cut from the contract? Pure HQ product call.

**Maintainer take:** cut it unless a web-components distribution story names a real consumer — no speculative shadow harness.

## 7. Consumer forks: Tabs arrows + Listbox typeahead compose the kernel

Source: `DECISIONS.md` suspected gap 2 (OPEN).

**What it does:** migrates the forked engines onto the kernel — Tabs replaces
its hand-rolled arrow handling with `RovingFocus` composition; Listbox routes
typeahead through the kernel (or its exported `TypeaheadModel`) so the landed
IME/editable guards apply once. Listbox's fork has a live bug: it consumes
IME-composing keys and steals focus mid-composition.

**API:** no `RovingFocus` API change — consumer-side composition:

```tsx
// Tabs: replace bespoke arrow handling with the kernel
<RovingFocus orientation="horizontal">{/* tab triggers as Items */}</RovingFocus>
// Listbox: route typeahead through the kernel model (IME/editable guards included)
```

Open design: HQ sequencing — Tabs first (pure arrow duplication) or Listbox
first (live IME bug)? And does Menu's click-open focus-parking policy survive
composition unchanged?

**Maintainer take:** do Listbox first — it fixes a live IME bug, while Tabs is pure dedup.
