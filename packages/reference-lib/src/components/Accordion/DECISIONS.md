# Accordion decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: collection policy over Collapsibles — single/multiple expansion plus optional header traversal.

## Landed (context, 2-4 lines)

Quarantine-landing ported 6 stability wins (dev identity/competing-authority
diagnostics, MULTI-04 canonicalization, keyboard hardening, nesting
isolation, React 19 composeRefs) plus the full 41-case suite (25 unit + 18
CT + 2 legacy smoke), then reworked the rejected controlled-only rewrite
back to flat base-compatible props with uncontrolled `defaultValue`
restored. Visuals frozen: 13 legacy snapshots green unmodified.
Log: `.agents/missions/quarantine-landing/accordion.md`; landing commit
`411c53799` (`feat(accordion): restore uncontrolled mode + land 6
quarantine stability wins, freeze visuals`).

## Candidate features (quarantine-sourced)

### 1. Discriminated single/multiple prop types — verdict: DECLINED

- **Source:** quarantine commit `569d00567`,
  `packages/reference-lib/src/components/Accordion/Accordion.tsx`
  (`AccordionSingleProps` / `AccordionMultipleProps` over
  `AccordionCommonProps`); case ID `AC-MULTI-06` (whose TESTS.md text
  still says "runtime validation must match the discriminated public
  type").
- **API sketch:** `expansion?: 'single'` pairs with
  `value?: string | null` / `onChange?: (value: string | null) => void`;
  `expansion: 'multiple'` (required literal) pairs with
  `value?: string[]` / `onChange?: (value: string[]) => void`. Mode/value
  mismatch becomes a compile error instead of a dev runtime throw; `value`
  / `defaultValue` unions disappear.
- **Why not landed:** tree-incompatible rewrite, rejected at captain
  review. No sound discriminant accepts a union-typed value with
  `expansion="single"`, so committed consumers break:
  `Collapsible.story.tsx` `AccordionNest` (`useState<string | string[] |
  null>`) failed tsc with TS2322, and `Showcase.book.tsx:383` passes
  `defaultValue="item-1"`. Rework dropped the discriminants for flat
  base-compatible props (`value` / `defaultValue` / `onChange` over
  `AccordionValue`) and kept only the dev runtime shape check. Zero
  external importers of the 3 discriminant names exist in `packages/` +
  `matrix/`, so nothing references the dropped names.
- **Revisit when:** HQ wants type-level mode/value coupling AND a
  discriminant design is proven that accepts every committed union-value
  consumer without edits (tsc over the full tree is the oracle).
- **Open questions:** none — hard DECLINED. Killer reason: a discriminant
  strict enough to be useful rejects the union values the tree already
  passes; the dev runtime throw covers the same mistakes without breaking
  anyone.

### 2. Accordion-side Find (`beforematch` / `hiddenUntilFound`) — verdict: DEFERRED → moved

Moved to [FEATURES.md](./FEATURES.md) (§1) — it needs a single-mode swap-vs-opt-in design call before anything can be pinned.

## Suspected gaps (no quarantine source)

### 1. Horizontal orientation — verdict: DECLINED

- **Evidence:** TESTS.md "Source evidence" cites Radix's "orientation key
  matrices" and Radix ships `orientation="horizontal"` with a
  Left/Right/Home/End header matrix; SPEC.md "Won't do" and TESTS.md "Out
  of scope" both name horizontal orientation explicitly. Quarantine never
  addressed it (zero orientation code in commit `569d00567`).
- **API sketch:** `orientation?: 'vertical' | 'horizontal'` (default
  vertical); horizontal swaps ArrowUp/Down for ArrowLeft/Right in header
  traversal, keeps Home/End on the enabled boundaries, keeps native Tab
  stops.
- **Why not landed:** deliberate scope cut, not an oversight: the APG
  accordion pattern is vertical, no committed consumer needs horizontal
  headers, and a horizontal row of headers with panels is usually Tabs
  wearing a costume.
- **Revisit when:** a committed consumer needs horizontal headers that
  Tabs genuinely cannot serve (state the consumer, not the abstraction).
- **Open questions:** none — hard DECLINED unless that consumer appears.
  Killer reason: horizontal accordion is Tabs-shaped demand; building it
  here forks header-keyboard policy across two components.

### 2. Radix-style non-collapsible single — verdict: DECLINED

- **Evidence:** [Accordion.md](./Accordion.md) ("Single vs multiple")
  states "Reference UI has no separate Radix-style `collapsible` prop"
  and TESTS.md `AC-SINGLE-02` freezes the opposite: activating the open
  item always requests `null`. Radix's single default keeps one item
  pinned open. Quarantine never proposed a pin-open API.
- **API sketch:** `collapsible?: boolean` (default true) on single
  expansion; with `collapsible={false}`, activating the open item is a
  no-op request-wise (no `onChange(null)`) and programmatic `null` could
  either be honored or warned on.
- **Why not landed:** frozen policy, not a gap: always-collapsible single
  is the documented contract, zero consumers have asked to pin an item
  open, and the prop would add a second single-mode state machine (what
  does `value={null}` mean when collapse is forbidden?) for no demand.
- **Revisit when:** a committed consumer needs a guaranteed-one-open
  disclosure group and can state why controlled state that ignores
  `null` requests is insufficient (that composition already works today).
- **Open questions:** none — hard DECLINED. Killer reason: ignorable
  `null` in controlled mode already composes pin-open behavior; a prop
  would only bless it with new edge semantics.

## Non-decisions (rejected outright)

- Controlled-only rewrite deleting `defaultValue` + internal store (quarantine mangling-class; restored in rework per landing rules) — rejection recorded in `.agents/missions/quarantine-landing/accordion.md` (REJECTED + Rework sections) and [SPEC.md](./SPEC.md) (Landing note).
- Deleting `keyboard: 'arrows'` (base API removal; restored as a `headers` alias for base compatibility) — recorded in [SPEC.md](./SPEC.md) (Gaps & incoherence) and the crew log Rework design.
- Stripping the `Accordion.Item` / `.Trigger` / `.Content` convenience aliases (quarantine kept them; so do we) — recorded in [SPEC.md](./SPEC.md) (Gaps & incoherence).

## Walkthrough notes for HQ

- Most important #1: discriminated types DECLINED (stays in this file) — flat union props keep the tree green. Feel it: open the Collapsible `AccordionNest` story and `Showcase.book.tsx` (`defaultValue="item-1"` honored, zero edits there); both would be red under discriminants.
- Most important #2: Find DEFERRED → moved to [FEATURES.md](./FEATURES.md) (§1). Feel it: open Book `SingleExpansion`, close all items, Ctrl/Cmd+F for hidden answer text; no item opens until Collapsible lands `beforematch` — then weigh in on the single-swap vs opt-in question recorded there.
- Most important #3: always-collapsible single, no pin-open prop (DECLINED, stays in this file). Feel it: in Book `SingleExpansion`, click the open item — it closes (`null` request). There is deliberately no way to forbid that; controlled parents that want pin-open ignore the `null`.
- Secondary: try keyboard traversal in the `KeyTraversal` / `KeyDisabled` stories (arrows skip disabled, Home/End hit enabled boundaries, Tab still visits every header) — that hardening, not new API, is what quarantine bought. Mechanical follow-ups, if any appear, live in [PATCHES.md](./PATCHES.md) (empty at split time).
