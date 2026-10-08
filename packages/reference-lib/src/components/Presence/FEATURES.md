# Presence features (needs design)

Open items that need an HQ product/UX/design call before anyone builds.
Triage rule: test-pinnable today → PATCHES.md; needs any product/UX/design
call → here; ambiguous → here.

## 1. GSAP completion wait as documented extension (from DECISIONS candidate #1)

**What it does:** Presence keeps an exiting child mounted until its finite
GSAP tweens finish, alongside CSS effects — blessing a third-party animation
library as a supported exit driver rather than merely tolerating the live
code paths. The alternative is deleting `finiteGsapTweens` and its branches
outright.

**API:** No new props — a documented behavior contract:

```md
present=false → child retained until CSS effects AND finite GSAP tweens
on the exiting element complete (reduced-motion gate included).
```

Blessing it means documenting the contract in `Presence.md` plus a
`PR-*-GSAP` proof case; deleting it means removing `finiteGsapTweens` and
every branch that consults it.

**Maintainer take:** Lean delete — no proven in-repo consumer and a third-party library in the exit contract is burden without benefit.

**Source:** quarantine commit `77ea89ba0`, SPEC.md "Frozen as progressive
enhancement" vs "Gaps & incoherence" ("Document that as a deliberate
extension or remove it"); open questions: any in-repo GSAP exit consumer
(rumored: Collapsible measured-height work), and whether HQ wants GSAP in
the contract at all.

**Disposition (2026-09-28, p2f-presence): KEEP — do not delete.**
The lean-delete premise ("no proven in-repo consumer") is false:
`Collapsible.tsx` renders `<Presence present>` around its content panel and
that panel's exit motion is GSAP-owned (`animateCollapse` tweens the exact
node Presence observes; `CO-PRES-02` "GSAP holds the exit", `CO-PRES-03`
reduced-motion shortcut). Verified in code + CT titles. Documented as a
deliberate extension in `Presence.md` and `SPEC.md`; proven by `PR-GSAP-01`.
This item is closed unless HQ explicitly re-opens it.
