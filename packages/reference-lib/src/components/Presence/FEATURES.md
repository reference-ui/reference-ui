# Presence features (needs design)

Open items that need a product, UX, or design decision before they are built. Items a test can pin today are fixed directly and not listed here; items that need such a decision, or whose status is ambiguous, are listed here.

## 1. GSAP completion wait as documented extension

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

**Recommendation:** Lean delete — no proven in-repo consumer and a third-party library in the exit contract is burden without benefit.

**Open questions:** whether any in-repo consumer relies on the GSAP exit, and whether GSAP belongs in the contract at all. The alternatives are to document it as a deliberate extension or to remove it.

**Decision: keep it.** `Collapsible.tsx` renders `<Presence present>` around its content panel and
that panel's exit motion is GSAP-owned (`animateCollapse` tweens the exact
node Presence observes; `CO-PRES-02` "GSAP holds the exit", `CO-PRES-03`
reduced-motion shortcut). It is documented as a deliberate extension in `Presence.md` and proven by `PR-GSAP-01`.
