# FocusLock features

Deferred gaps that need a design call or a repro before implementation. Source: DECISIONS.md Suspected gaps.

## 1. Cross-document trapping (`crossFrame`) (from DECISIONS gap #1)

**What it does:** Lets an outer lock contain focus inside same-origin iframe content instead of treating each `<iframe>` element as one opaque stop. Today a lock never traverses frame content or traps across Documents — one lock stack per Document (`FL-NEST-06` / `FL-CAND-12` / `FL-CAND-14`).

**API sketch:**

```tsx
<FocusLock crossFrame>
  <iframe src="/same-origin-dialog" />
</FocusLock>
```

Opt-in prop (name illustrative); cross-origin traversal stays impossible by platform design.

**Maintainer take:** Deliberate boundary, not an oversight — revisit only when a real consumer needs nested same-origin iframe dialogs contained by one outer lock.

**Status:** DEFERRED — not implemented. No in-repo consumer traverses frame content (verified: locks are scoped per-Document, `FL-NEST-06`; iframes stay opaque stops, `FL-CAND-12` / `FL-CAND-14`).

## 2. TalkBack virtual-modality skip (from DECISIONS gap #2)

**What it does:** Skips virtual-modality handling on Android Chrome TalkBack (cf. Aria's skip), behavior-only — parked as not a production blocker with no consumer pain evidenced.

**API sketch:** No new props — internal behavior change only.

**Maintainer take:** Parked without a repro — do not implement until an a11y audit or TalkBack user report names a concrete failure inside a locked dialog.

**Status:** DEFERRED — not implemented. No TalkBack repro on file (verified: only vendor note in `FocusLock.md`).
