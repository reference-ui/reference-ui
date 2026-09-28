# REPORT — Remaining Issues (landing sequence)

Plain-language breakdown of everything still open, with the smallest
code that shows each problem. Status as of 2026-09-28, HEAD c7fbc2713.

The 2026-09-24 W4-cutover report is fully retired: variant relocation,
css accommodation (c), S4/S5A/S5/S6 landings, ruling-8, ruling-4, and
the sync.test.ts tripwire are all landed/moot and their sections are
deleted, not carried. What follows is only what is still live.

## 0. Standing law (unchanged)

`reference-lib` is user space. Any tightening that breaks it is void
as specified; the fix goes below user space (Neo/atomic), or the
tightening relocates to a position user space never touches.

## Summary

| Issue | State | Needs |
|---|---|---|
| SITE-16 member-through-bound-root | Root-caused, design conflict | HQ ruling (§1) |
| Matrix sweep (FF/WebKit, all) | Crew out on landed tree | Nothing now |
| HQ API/productionization pass | Yours | Your read-through |
| NumberField lattice/validate/live | Blocked on HQ calls | Rulings (§3) |
| `playwright/ct.ts` type errors | Pre-existing, live | Nothing now |

## 1. SITE-16: bound member root vs the shadow gate (RULED + LANDED)

**What's broken.** The world binds a namespace object and renders
through it; the configured concatenated host never fires:

```tsx
// world/src/app.tsx — the case (NEO-SITE-16):
const NS = { Panel: Div }
const Other = { Panel: Div }

<NS.Panel color="brand" p="sm" id="member">   {/* must extract */}
<Other.Panel bg="paper" id="twin">              {/* must stay silent */}
```

```ts
// world/ui.config.ts:
jsxElements: ['NSPanel']   // concat host: NS + Panel
```

Repro (quoted): `pnpm agentneo run NEO-SITE-16` → exit 1,
`FAIL member.spec.ts: sheet carries member color`. The synced sheet
carries tokens but zero utilities.

**Why.** The tag gate refuses every locally-bound member root before
the concatenated-host match is ever consulted:

```rust
// extract/context.rs — allows_jsx_tag:
pub fn allows_jsx_tag(&self, name: &str) -> bool {
    if bindings::is_shadowed(self.shadowed, name) {
        return false;
    }
    if let Some((root, _)) = name.split_once('.') {
        if bindings::is_shadowed(self.shadowed, root) {
            return false;   // ← "NS" is shadowed by `const NS`, exit here
        }
    }
    if self.jsx_hosts.contains(name) {
        return true;
    }
    name.contains('.') && self.jsx_hosts.contains(&name.replace('.', ""))
    // ← the NSPanel concat match: never reached for bound roots
}
```

Every `const` (module-top included) lands in the shadow set via
`add_declarator_shadow` (`extract/visitor.rs`), so `const NS`
vetoes `<NS.Panel>` unconditionally.

**The discriminator.** ATM-SITE-22 passes with the identical shape
because its root is entirely unbound (`Overlay` bare +
`void OverlayContent`); SITE-16 binds `const NS` and goes silent.
Bound-vs-unbound root is the whole difference.

**The conflict.** The refusal is not a bug — it is pinned
correctness. The opaque-rebinding case must stay silent:

```rust
// extract/tests/gating.rs — test_shadowed_member_root_is_not_an_extract_site:
import { Tabs } from './tabs';
function Other() { return null; }
export function App() {
    const Tabs = Other;   // rebinds away from the traced host
    return <Tabs.Panel mt="2r" value="a" />;  // must NOT collect
}
assert!(res.wants.is_empty());
```

The case wants `const NS = { Panel: Div }` to extract; the gate
says any bound root rebinds away and must stay silent "instead of
collecting onto the wrong component." Both cannot hold. The gate
is also mirrored in `diagnostics/analysis/jsx.rs` + `gate.rs`,
so whatever is ruled must land in all three in lockstep.

**Candidate semantics.**

- (i) *Resolve through object literals.* A root bound to a
  same-file `const` object literal is transparent: `NS.Panel`
  resolves member `Panel` → `Div`, and `Div` is a host, so the
  site is admitted to normal host-membership checks (configured
  `NSPanel` hits, unconfigured `OtherPanel` twin stays silent
  through membership, not shadowing). Opaque rebindings
  (`const Tabs = Other`) stay silent; the pinning test keeps
  passing. Cost: extract + both mirrors + scope-init handling
  (declaration order must not matter) + a new atomic station.
- (ii) *Configured hosts win over shadowing.* Any bound root
  extracts if the concatenated host is configured. Small in
  lines — but it deletes the gate's entire purpose: a rebinding
  like `const Tabs = Other` would silently collect onto the
  wrong component for every configured host. Requires
  rewriting the pinning test and accepting the hole.

**Recommendation: (i), and reject the two evasions.** (ii) breaks
a pinned correctness property to buy line-count; the silence
guarantee is load-bearing and the hole it opens is silent
wrong-component collection — the exact failure the gate exists
to prevent. Rewriting the world to an unbound/namespace-import
spelling is theater, not a fix: that coverage already passes
via SITE-22 and the SITE-87/gating tests, and the case's unique
value is precisely the bound root. Under (i) the twin negative
keeps working for the reason the case was designed around (the
twin is *unhosted*), and the opaque-rebinding pin stands.

**Work plan once ruled:** implement (i) in `extract/context.rs` +
`diagnostics/analysis/jsx.rs` + `gate.rs` (lockstep, resolving
through scope-init/binding tables, not walk order); add an
atomic station (bound-root member extracts + twin negative);
re-run all 251 atomic stations for flips; re-prove with
`pnpm agentneo run NEO-SITE-16` + `pnpm agentrs c atomic`.

**Landed 2026-09-28** (`0267a8762`): semantic (i) in
`extract/context.rs` + `diagnostics/analysis/jsx.rs` lockstep
(`gate.rs` verified attr-filter-only, no change), scope-table
resolution (order-independent), new ATM-SITE-88 station. Proof:
gating 13/13, cargo 738+1+1+7+5 zero failed, quality 0
violations, flip check 252/252, `NEO-SITE-16` PASS. The
case-vs-contract conflict above is kept as the decision record.

## 2. Landing status (since the last report)

All verified firsthand by the captain on React 17/18/19 and
committed on `reference-system`, tree clean:

- **Finish-line P2 chains**: Select 73/73+98/98+64/64, Date
  (DateField/Calendar/Field), Disclosure (Tabs/Collapsible/
  Accordion), Menu 85/91, primitives, Slider 73/73, Switch 26/27,
  RovingFocus 53/55, Portal/Overlay seam. Pre-existing reds
  itemized, never absorbed.
- **NumberField 99/148**: wave-2 (+28: format/parse/edit/commit/
  comp) and the FORM leg (+3: FORM-11/12/14 event-order CT).
  Forms/submit/reset fully green on 17/18/19.
- **AXE infra**: repo-level `playwright/axe.ts` scanner
  (`expectNoAxeViolations` + report-only `scanAxe`, devDeps
  only, no API surface). Every `*-A11Y-01` scanner half is now
  unblocked on infra. Handoff: Combobox's open-popover story
  reports an unlabeled input for the CB scanner-half author.
- **REDS 3/4**: harvest-census re-pin (4/4), HINTS pin refresh
  (8/8), React-17 async loading fixed at the Announcer root
  (render-stable election id; 35/35 on 17, no 19 regression).
  SITE-16 is the 1/4 skip → §1.
- **Sweep returned**: 1710/1784 legs (95.9%) — FF 872/892, WebKit
  838/892, 68 findings in 5 clusters (SWEEP.md). Fully green both
  engines: Field, Tabs, Collapsible, Menubar, Presence, Portal.
  Hermetic chain-t2 froze (UNKNOWN, gap stands).
- **DIAG verdicts**: WebKit focus = platform model (scope ~24
  traversal assertions; restore/trap = product-hardening tail);
  FF dup commit = REAL double-`onChange` re-entrancy bug (fixing);
  Home/End caret = platform no-op (scope); F40 = scope. No WebKit
  keyboard pref exists in Playwright — scoping stands, no
  harness alternative.
- **Fix wave out**: FIX-D2 (NumberField re-entrancy), SCOPE-1
  (Select chain), SCOPE-2 (Date/Disclosure/Menu/FocusLock
  traversal). Held: restore/trap fixes (focus ruling), G1/H1
  (confirm), Splitter cluster (4a).

## 3. HQ pile (yours, in one place)

- **Focus ruling** (gate for restore/trap fixes): should
  FocusLock restore + trap-reclaim harden against Safari's
  no-click-focus / mousedown-blur model (F47/F48/F53/F54/F56,
  F57, F58)? And if the D3 trigger probe confirms keys-after-
  mouse-open go to body, explicit trigger `.focus()` on open?
- **G1/H1 confirm**: G1 chromium-UA gate → skip-by-project
  (recommended); H1 CDP test → mark chromium-only.
- **API/productionization read-through**: naming 1a, W-02
  sub-rulings, Splitter 4a execution, snapshot policy, Switch /
  Slider takes, Date takes. No crew touches API surfaces until
  you rule.
- **NumberField engine calls** (block the remaining 45
  automatable cases + 4 manual gates): lattice/snap anchoring (zero-anchor?
  ties? endpoints?), validate retain-vs-reject, live-request
  vs pinned B-19 commit-only titles. Crews are held off these
  — engine flips without rulings would break green titles.
- **After rulings**: Intl grammar engine (PARSE bulk),
  edit-filtering/caret/composition engine (EDIT bulk),
  ENV-02/ENV-06 probes, EDIT-16 undo harness, then docs phase.

## 4. Carried, no action

- `playwright/ct.ts` type errors (mount/screenshot vocabulary)
  still show in lib's local typecheck; still involve none of
  the new types; still presumed pre-existing. Confirmed live
  today, still harmless (T1 never gated on them).
- Kill-leg flakes: still load-sensitive noise, still green on
  isolated re-run. Discipline stands: attribute every red by
  name, re-run isolated, full green before landing.
