# Announcer decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: document-scoped invisible live-region runtime (`announce()` plus polite/assertive regions).

## Landed (context, 2-4 lines)

Ported quarantine stability wins byte-identical (activation reset, untargeted-routing diagnostic, host election, pending cap 50, `aria-atomic` + contract selectors): 12/12 unit, host-verified invisible, zero paint delta. Matrix e2e/unit corpus is proof, not API — handed to test-core for re-targeting, so it gets no decision item here. Crew log: `.agents/missions/quarantine-landing/announcer.md`; landing commit `c1096abfe`.

## Candidate features (moved)

Titles kept for traceability; full entries live in the new files.

1. Dedicated Announcer Book story → `FEATURES.md` #1 (needs design: story necessity, readout purity).
2. Public export freeze (SPEC defect 4) → `FEATURES.md` #2 (needs design: breaking export narrowing).
3. Drop `data-testid` aliases → `PATCHES.md` #1 (mechanical: contract-selector cleanup).

## Suspected gaps (moved)

4. Dev-gated, deduped ambiguous-call diagnostic → `PATCHES.md` #2 (mechanical: specified diagnostic fix).
5. Product path for multi-document hosts → `FEATURES.md` #3 (needs design: iframe topology choice).

## Non-decisions (rejected outright)

No mangling-class items exist for Announcer — the quarantine commit is the clean-salvage case (crew log § Quarantine analysis; recon §4 exhibits untouched). Scope items rejected outright, one line each:

- Per-call `timeout` — rejected in SPEC Won't-do; freeze keeps the single 7000ms `ANNOUNCE_CLEAR_DELAY`.
- Public `clearAnnouncer` / `destroyAnnouncer` — rejected in SPEC Won't-do and README Lift/Leave (React Aria parity deliberately not lifted).
- Public `LiveAnnouncer` Provider / Spectrum body-singleton mount — rejected in SPEC Won't-do ("Do not add a public Provider") and README Lift/Leave.
- `aria-live` on toast cards or control primitives; guessing text from visual JSX — rejected in SPEC Won't-do and "Do not duplicate" (NumberField TESTS.md shares `announce()`, no private regions).
- Same-channel FIFO burst after activation; pausing recycle while hidden or under Overlay — rejected by the freeze (token last-write-wins; `ANN-ENV-06`).
- `aria-relevant` experiments, `role="log"`, status-only assertive hacks — rejected in SPEC Won't-do until a named AT defect requires them.
- `as` prop on the host — out of scope per SPEC "Do not duplicate" row.

## Features campaign resolutions (2026-09-26)

- `FEATURES.md` #1 (Book story): landed — `Announcer.story.tsx`
  (`AnnouncerFixture`: Announce Polite/Assertive buttons + MutationObserver
  readout mirror) surfaced in Book via `Announcer.book.tsx`. Visible readout
  chosen over pure (triage: manual-AT click target + readout).
- `FEATURES.md` #2 (export freeze): landed — public barrel is `announce` +
  `AnnounceOptions` only; host/snapshot/constants/registry/diagnostics/store
  moved to the internal/test-only `internal.ts` entry with no shims.
  Consumer audit in the same change: `ReferenceLibrary.tsx` (sole
  `AnnouncerHost` user) migrated to `../Announcer/internal`; `announce`
  users (`Toast.tsx`, `Toast.story.tsx`, `ReferenceLibrary.story.tsx`)
  unaffected; matrix/Showcase/books have no Announcer-symbol consumers.
  Pinned by `ANN-API-07` (runtime barrel keys `== ['announce']`).
- `FEATURES.md` #3 (multi-document topology): decided (a) —
  ReferenceLibrary-per-document is the product topology; direct
  `<AnnouncerHost document>` mount is test-only (recorded in README +
  SPEC freeze).

## Walkthrough notes for HQ

- Most important #1 is `FEATURES.md` #2 (export freeze): today any app can mount a second `AnnouncerHost` and double-speak — in Book open the ReferenceLibrary story, count `[data-reference-announcer-host]` nodes in devtools (must be exactly 1), and weigh whether the host stays importable.
- Most important #2 is `FEATURES.md` #3 (multi-document product path): iframe/microfrontend apps need to know where hosts live — try untargeted `announce("Nope")` in the console with two hosts mounted and watch the diagnostic; then decide whether ReferenceLibrary-per-document is the topology.
- Most important #3 is `PATCHES.md` #2 (diagnostic gating): the ambiguous-call warning fires in production on every call — compare with Toast's dev-only diagnostic and confirm the "one development diagnostic" freeze wording holds; the fix itself is mechanical once confirmed.
- Mechanical cleanup `PATCHES.md` #1 (testid aliases): feel it on any Toast/ReferenceLibrary story — `[data-reference-announcer]` and `data-testid` still point at the same nodes until the migration trigger lands.
- Minor doc debt, not a decision: `README.md` still describes sticky `activated` as the current engine ("a production blocker") although landing fixed it — needs a one-paragraph refresh when SPEC defects 1–3 are reworded as fixed.
