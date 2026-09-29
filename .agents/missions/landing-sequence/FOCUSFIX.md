# FOCUS-FIX — objective log

IN PROGRESS

Scope: FL-RESTORE-10 FF full-suite-only red (green isolated, red
2/2 full-suite) — regression from the pointer-origin fallback.
Hypothesis: module-level per-document recorder persists across
tests in the shared gallery (stale origin). Confirm with evidence,
then fix (e.g. clear on lock deactivate/unmount, gesture-scoped
freshness, or equivalent — minimal, no API changes). Prove:
FocusLock FF full ×2 + WK full + `pnpm agentct FocusLock`, all
green, output captured to file. Box: 45 min. Files: FocusLock dir
only. Crew writes below.
