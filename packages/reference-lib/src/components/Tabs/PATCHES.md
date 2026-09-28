# Tabs patches

Mechanical follow-ups: fully specified, test-pinnable today. Each entry
names the proof that would pin it. Split out of `DECISIONS.md`; that file
keeps the verdicts, this file keeps the work list.

Both entries LANDED 2026-09-28 (finish-line P2D).

### 1. Registration maps (identity registry) (from DECISIONS candidate #4)

- **What:** Internal value → `{ id, element, disabled }` registry with effect subscribe/unsubscribe; explicit Tab `id` flows into its Panel's `aria-labelledby`; insert/reorder/remove keep IDs stable.
- **Acceptance:** Test pins explicit Tab `id` appearing in the Panel's `aria-labelledby` (today it dangles — Panel rebuilds the tab ID from `baseId`), plus ID stability across dynamic add/remove (`TB-DOM-06`, `TB-DYNAMIC-01`/`02`).
- **Source:** quarantine `a49fc0626`, `Tabs.tsx:102-168`; `DECISIONS.md` candidate #4.

### 2. ShadowRoot focus tracking (from DECISIONS gap #2)

- **What:** Resolve the active element through shadow roots (`getRootNode` + `shadowRoot.activeElement` walk) so arrow keys work inside a ShadowRoot; preferably owned by RovingFocus when `FEATURES.md` #2 lands.
- **Acceptance:** `TB-ENV-03` proof: tablist rendered in a ShadowRoot, arrow keys move focus instead of going dead (today `document.activeElement` returns the host, index is -1).
- **Source:** `Tabs.tsx:183`; `DECISIONS.md` gap #2.
