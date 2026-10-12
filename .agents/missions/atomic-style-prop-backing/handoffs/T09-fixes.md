# T09-fixes (W3) — Overlay.Arrow / Overlay.Handle consumer-override forwarding

Status: **DONE**

Territory: `packages/reference-lib/src/components/Overlay/parts/{Arrow,Handle}.tsx`
(+ one new test, `parts/forwarding.test.tsx`). Nothing committed; changes left in the working tree.

---

## 1. Files + diff

The four T09 PINNED rows were `Overlay.Arrow`, `Overlay.Handle`, and the two delegating
parts `Popover.Arrow` / `Tooltip.Arrow`. The delegates need no edit — they forward `{...props}`
straight into `Overlay.Arrow`, so fixing the base part fixes all four.

**Fix shape:** move the part's geometry/chrome literals *before* `{...props}` (they become
defaults the consumer's style props override), while keeping the managed attributes
(data markers, composed `ref`, gesture handlers) *after* the spread. `style`/`className`
stay destructured-out and applied last, unchanged.

### `packages/reference-lib/src/components/Overlay/parts/Arrow.tsx`

```diff
   return (
     <Div
+      position="absolute"
+      width="2r"
+      height="2r"
+      pointerEvents="none"
       {...props}
       data-reference-overlay-arrow=""
       data-edge-padding={edgePadding}
       ref={(node: HTMLDivElement | null) => {
         if (context) context.arrowRef.current = node
         assignRef(userRef, node)
       }}
-      position="absolute"
-      width="2r"
-      height="2r"
-      pointerEvents="none"
       className={className}
       style={style}
     />
```

### `packages/reference-lib/src/components/Overlay/parts/Handle.tsx`

```diff
   return (
     <Div
-      {...props}
-      data-reference-overlay-handle=""
-      ref={(node: HTMLDivElement | null) => assignRef(userRef, node)}
-      onPointerDown={handlePointerDown}
-      onPointerMove={handlePointerMove}
-      onPointerUp={handlePointerUp}
-      onPointerCancel={handlePointerUp}
       width="8r"
       height="1r"
       borderRadius="full"
       bg="colors.gray.400"
       mx="auto"
       my="2r"
       cursor="grab"
       touchAction="none"
+      {...props}
+      data-reference-overlay-handle=""
+      ref={(node: HTMLDivElement | null) => assignRef(userRef, node)}
+      onPointerDown={handlePointerDown}
+      onPointerMove={handlePointerMove}
+      onPointerUp={handlePointerUp}
+      onPointerCancel={handlePointerUp}
       className={className}
       style={style}
     />
```

### New test — `packages/reference-lib/src/components/Overlay/parts/forwarding.test.tsx`

Colocated Vitest (skill §"Unit"), SSR `renderToString` — precedence is pure prop resolution,
so no browser is needed. Three cases: Arrow default==literal and override wins; Handle
default==literal and override wins; `Popover.Arrow` / `Tooltip.Arrow` inherit the Arrow override.

---

## 2. Evidence

### Unit — `pnpm agentct Overlay --unit`

```
 ✓ src/components/Overlay/parts/forwarding.test.tsx (3 tests) 12ms
 ...
 Test Files  9 passed (9)
      Tests  40 passed (40)
Unit: passed | 40 tests
```

The new specs assert, byte-for-byte, root `class` equality:

- **Default unchanged:** `Overlay.Arrow` class === `<Div position="absolute" width="2r" height="2r" pointerEvents="none" />` class (and Handle likewise against its 8 literals).
- **Override wins:** `Overlay.Arrow width="6r"` class === the `<Div>` with `width="6r"` (default `2r` gone), and `≠` default class. `Overlay.Handle bg="colors.red.500"` likewise.
- **Delegation inherits:** `Popover.Arrow width="6r"` and `Tooltip.Arrow width="6r"` classes both equal the `width="6r"` reference.

### Component CT (React 19) — `pnpm agentct <C> --e2e`

```
Overlay: E2E 120 | Passed 120 | Failed 0 | react19: 120 passed | 0 failed
Popover: E2E  19 | Passed  19 | Failed 0 | react19:  19 passed | 0 failed
Tooltip: E2E  15 | Passed  15 | Failed 0 | react19:  15 passed | 0 failed
```

No snapshot drift (all `toHaveScreenshot` baselines matched), confirming the default render is
visually identical. The anchor fixture's arrow (`anchor-fixture.tsx:249/273`) sizes via inline
`style`, which the part still applies last — unaffected.

**One flake note (not a regression):** an initial concurrent three-component run reported
`OV-PRES-01` (Presence/exit lifecycle, unrelated to Arrow/Handle) failing under worker
contention. Re-run in isolation → 1/1 passed; full Overlay re-run alone → 120/120. Confirmed flake.

---

## 3. Ten-line note

1. **Status:** DONE — Arrow + Handle forwarding fixed; Popover/Tooltip arrows inherit by delegation; nothing committed.
2. **Pinning verdict:** the geometry/chrome values themselves are *intended defaults*, but laying them **after** `{...props}` made them hard pins that beat the consumer — a forwarding defect, now fixed.
3. **Fix:** literals moved before the rest spread; they remain the default when the consumer passes nothing.
4. **Managed attributes stay authoritative:** `data-reference-overlay-{arrow,handle}`, `data-edge-padding`, composed `ref`, and Handle's gesture handlers remain after the spread (by design, not consumer-styleable).
5. **`style`/`className`** stay destructured-out and applied last — unchanged, so inline-style and class channels keep winning as before.
6. **Default output is byte-identical:** no-override root `class` equals the literal-only `<Div>`; all Overlay/Popover/Tooltip CT snapshots pass.
7. **Override now wins:** a consumer style prop on the part root reaches the primitive (only the consumer value is minted), per STYLE_PROP_EXTERNAL §5.3.
8. **Style-prop key order is preserved**, so the minted default class string is unchanged (no CSS churn; no sync needed for the component literals).
9. **Scope:** 2 source files + 1 test; no API change; no other component touched.
10. **Evidence:** unit 40/40, Overlay CT 120/120, Popover CT 19/19, Tooltip CT 15/15 (React 19); the one OV-PRES-01 red was a concurrent-worker flake.
