# Announcer FEATURES crew — log

Mission: Announcer IMPLEMENT-NOW #1–#3 on reference-system, no branch switch, no commit.
Inputs read: triage Announcer § (features-triage.md:16-19), FEATURES.md (3 items), API-STANCE.md.

## Plan checkpoint (before further reads)
1. Read Announcer dir files (SPEC, DECISIONS, index.ts, Announcer.tsx, tests, PATCHES log) + test-component skill + ux-designer skill.
2. #1: Add `Announcer.story.tsx` — ReferenceLibrary + Announce Polite/Assertive buttons + visible last-spoken readout. No API surface. Check Book conventions read-only (another component story) then write.
3. #2: Export freeze — public `index.ts` (Announcer + lib root re-export) keeps `announce` + `AnnounceOptions` (+types); move host/snapshot/constants/register/diagnostic/resolve/store to internal/test-only entry. Consumer audit + migration in same change: sweep stories, books, Showcase, tests for Announcer-consumer call sites; list each touched.
4. #3: Document topology (a) — ReferenceLibrary-per-document as product path; direct host mount test-only. Update SPEC/DECISIONS/README accordingly.
5. Guardrails: breaking NOW, no shims. Visuals: live-region invisible — expect zero snapshot changes; STOP+flag if any change.
6. Proof: `pnpm agentct Announcer` (unit+e2e green). UX review: nested ux-designer (or self-review by method + flag if pool full).
7. Touch only: `packages/reference-lib/src/components/Announcer/` + this log (+ consumer call sites for #2 migration, listed).

## Design (post-reads)
- Book discovers `**/*.book.tsx` only (book/discovery/glob.ts); `.story.tsx` is the CT-fixture convention. #1 ships BOTH from one implementation: `Announcer.story.tsx` exports `AnnouncerFixture` (FEATURES API text), `Announcer.book.tsx` maps it into Book (triage "Book story" / manual click target). Single implementation, no duplication.
- Readout: MutationObserver mirror of both live regions' textContent (genuine verification, not echo state). Open question in FEATURES ("visibly or pure") resolved visible per triage "click target + readout".
- #2: narrow `index.ts` to `announce` + `AnnounceOptions` (public); new `internal.ts` re-exports host/snapshot/constants/register/diagnostic/resolve/store (internal/test-only entry). `Announcer.tsx` untouched (zero behavior drift). Consumer audit: `announce` users (Toast.tsx, Toast.story.tsx, ReferenceLibrary.story.tsx) unaffected; only `AnnouncerHost` user ReferenceLibrary.tsx migrates to `../Announcer/internal`; matrix has zero announcer refs; neo/tasty hits are `announceLabel` prose. ANN-API-07 extended to pin runtime barrel keys == ['announce'].
- #3: doc-only — README/SPEC/DECISIONS record (a) ReferenceLibrary-per-document product topology, direct host mount test-only.
- Proof: new `__e2e__/Announcer.ct.spec.ts` WITHOUT snap() (invisible host; behavior asserts only) so agentct Announcer is unit+e2e green with zero snapshot surface.

## Progress
- [x] Inputs read, plan checkpointed
- [x] Reads + consumer audit complete
- [x] #1 story + book + CT spec
- [x] #2 export freeze + migration
- [x] #3 topology docs
- [x] agentct proof
- [x] UX review (nested; 1 finding fixed + re-verified)

## Proof
- `pnpm agentct Announcer`: unit 15/15, e2e 1/1 (react19) — incl. after contrast fix.
- Collateral: `pnpm agentct ReferenceLibrary` 3/3 e2e, `pnpm agentct Toast` 60/60 e2e + 52 unit — zero snapshot failures (guardrail: no visual change; Announcer.tsx untouched).
- `tsc --noEmit`: 0 errors mentioning Announcer (7 pre-existing errors in other crews' files: ct.ts, Icon.book, NumberField, Slot.test).
- UX (nested child, ux-designer method): design APPROVED; 1 fail-closed finding — hardcoded `#475569` explainer text unreadable in Book dark default → fixed (inherit color), re-verified green. Live-region DOM PASS unchanged; readout honesty PASS (plain dl, no double-speak); buttons PASS; keyboard/focus ring UNVERIFIED (needs eyes in fresh Book).
- Flag: Book server on :5000 predates `Announcer.book.tsx` (stale glob manifest); needs owner restart to surface the Announcer story. Not restarted (another crew's process).

## Files changed
Announcer dir:
- `packages/reference-lib/src/components/Announcer/internal.ts` (NEW — internal/test-only entry)
- `packages/reference-lib/src/components/Announcer/index.ts` (narrowed to announce + AnnounceOptions)
- `packages/reference-lib/src/components/Announcer/Announcer.test.ts` (imports via index/internal; ANN-API-07 freeze pin)
- `packages/reference-lib/src/components/Announcer/Announcer.story.tsx` (NEW — fixture)
- `packages/reference-lib/src/components/Announcer/Announcer.book.tsx` (NEW — Book entry)
- `packages/reference-lib/src/components/Announcer/__e2e__/Announcer.ct.spec.ts` (NEW — no snap())
- `packages/reference-lib/src/components/Announcer/README.md`, `SPEC.md`, `DECISIONS.md` (topology decision + resolutions)
Consumer call sites (#2 migration):
- `packages/reference-lib/src/components/ReferenceLibrary/ReferenceLibrary.tsx` (1 line: AnnouncerHost import → ../Announcer/internal)
Untouched by design: `Announcer.tsx` (zero behavior drift), Toast/*, stories using `announce`.
