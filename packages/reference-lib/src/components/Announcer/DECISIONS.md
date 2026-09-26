# Announcer decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: document-scoped invisible live-region runtime (`announce()` plus polite/assertive regions).

## Landed (context, 2-4 lines)

Ported quarantine stability wins byte-identical (activation reset, untargeted-routing diagnostic, host election, pending cap 50, `aria-atomic` + contract selectors): 12/12 unit, host-verified invisible, zero paint delta. Matrix e2e/unit corpus is proof, not API — handed to test-core for re-targeting, so it gets no decision item here. Crew log: `.agents/missions/quarantine-landing/announcer.md`; landing commit `c1096abfe`.

## Candidate features (quarantine-sourced)

### 1. Dedicated Announcer Book story — verdict: DEFERRED

- **Source:** quarantine commit `a19418ed3`, `Announcer.book.tsx` (`Default`), no case ID.
- **API sketch:** a `.story.tsx` rendering `<ReferenceLibrary>` + "Announce Polite" / "Announce Assertive" buttons + a visible "Last spoken message" readout, so HQ can click and watch live-region text change in devtools.
- **Why not landed:** stale `.book.tsx` convention — the tree uses `.story.tsx`, no Announcer story exists, and the visual check rides the ReferenceLibrary/Toast stories that already mount the host.
- **Revisit when:** HQ wants an interactive announce demo in Book, or manual AT verification needs a click target outside Toast.
- **Open questions:** does an intentionally invisible runtime need its own story, or is riding ReferenceLibrary/Toast enough? Should the story expose region text visibly (quarantine's last-spoken readout) or stay pure?

### 2. Public export freeze (SPEC defect 4) — verdict: DEFERRED

- **Source:** quarantine commit `a19418ed3`, `Announcer.tsx` (added `MAX_PENDING_ANNOUNCEMENTS`, `register/unregisterAnnouncerDocument`, `announcerDiagnostic`, `resolveAnnouncerDocument`, `getAnnouncerStore` to the `export *` surface), no case ID; SPEC "Defects this freeze names" 4; crew-log handoff ("direction still open for a future freeze pass").
- **API sketch:** `index.ts` narrows to `announce` + `AnnounceOptions` (plus types); `AnnouncerHost`, `getAnnouncerSnapshot`, `ANNOUNCE_CLEAR_DELAY`, and the five new internals move to an internal/test-only entry. Applications lose the ability to mount a second host.
- **Why not landed:** faithful port — narrowing is a breaking change needing a freeze pass plus a consumer audit (Toast imports `announce`; quarantine matrix fixtures mount `AnnouncerHost` directly; matrix unit leans on `getAnnouncerSnapshot`).
- **Revisit when:** the next freeze pass before production, once test-core settles the matrix re-targeting and the fixture/test consumer list is known.
- **Open questions:** which probes stay reachable for tests (`getAnnouncerSnapshot`)? Does `AnnouncerHost`'s `document` prop ever become supported app API for iframe mounts, or does it go internal with the host?

### 3. Drop `data-testid` aliases (contract-selector migration) — verdict: DEFERRED

- **Source:** quarantine commit `a19418ed3`, `Announcer.tsx` (kept `data-testid="polite/assertive-announcer"` as aliases next to `data-reference-announcer`); case `ANN-DOM-05`.
- **API sketch:** remove both `data-testid` attributes; `data-reference-announcer="polite" | "assertive"` becomes the only selector. No behavior change.
- **Why not landed:** migration in flight — Toast/ReferenceLibrary tests still select by testid, and `ANN-DOM-05` explicitly asserts both selectors point at the same nodes during migration.
- **Revisit when:** Toast, ReferenceLibrary, and matrix tests assert contract selectors only; then the removal is mechanical.
- **Open questions:** none — cleanup with a clear trigger, not a product question.

## Suspected gaps (no quarantine source)

### 4. Dev-gated, deduped ambiguous-call diagnostic — verdict: OPEN

- **Evidence:** landed `Announcer.tsx:49-56` warns on *every* ambiguous untargeted call in *all* environments, but the SPEC freeze and `ANN-API-05` require "**one** development diagnostic"; sibling `toastDiagnostic` (`Toast/toastRuntime.ts:116-120`) is `NODE_ENV`-gated via the `globalThis` pattern — Announcer diverges from both the freeze and its sibling.
- **API sketch:** gate `announcerDiagnostic` on `NODE_ENV !== 'production'` (same `globalThis` pattern; the package declares no node types) and dedupe repeats — warn once per message shape, not once per call.
- **Why not landed:** never proposed — quarantine wrote the helper ungated and landing kept it faithfully; the divergence surfaced only in this DECISIONS pass.
- **Revisit when:** before production, or when `RL-ROOT-08` conformance is audited across Toast/Announcer.
- **Open questions:** share one diagnostic helper with Toast, or keep per-component twins? Dedupe scope: once per session, per document, or per call site?

### 5. Product path for multi-document hosts — verdict: OPEN

- **Evidence:** quarantine's fixture mounts `<AnnouncerHost document={doc}>` directly inside iframe documents (`components-quarantine:matrix/lib/src/announcer.tsx:183`), but `README.md:22` says applications never mount `AnnouncerHost` and ReferenceLibrary is the only supported host — while `ANN-API-03` / `ANN-ENV-03` / `ANN-ENV-05` require per-document hosts to exist.
- **API sketch:** either (a) document ReferenceLibrary-per-document as the product topology and leave the direct mount as a test-only shortcut, or (b) bless `<AnnouncerHost document>` as the supported recipe for iframe/Shadow documents.
- **Why not landed:** fixtures are test-only and no product decision exists; landing never touched matrix, so the contradiction stands.
- **Revisit when:** test-core re-targets `announcer.spec.ts` and must pick the iframe-mount recipe — that choice freezes the answer.
- **Open questions:** is ReferenceLibrary-in-iframe the supported topology? If (b), does the `document` prop go public and interact with decision 2's export freeze?

## Non-decisions (rejected outright)

No mangling-class items exist for Announcer — the quarantine commit is the clean-salvage case (crew log § Quarantine analysis; recon §4 exhibits untouched). Scope items rejected outright, one line each:

- Per-call `timeout` — rejected in SPEC Won't-do; freeze keeps the single 7000ms `ANNOUNCE_CLEAR_DELAY`.
- Public `clearAnnouncer` / `destroyAnnouncer` — rejected in SPEC Won't-do and README Lift/Leave (React Aria parity deliberately not lifted).
- Public `LiveAnnouncer` Provider / Spectrum body-singleton mount — rejected in SPEC Won't-do ("Do not add a public Provider") and README Lift/Leave.
- `aria-live` on toast cards or control primitives; guessing text from visual JSX — rejected in SPEC Won't-do and "Do not duplicate" (NumberField TESTS.md shares `announce()`, no private regions).
- Same-channel FIFO burst after activation; pausing recycle while hidden or under Overlay — rejected by the freeze (token last-write-wins; `ANN-ENV-06`).
- `aria-relevant` experiments, `role="log"`, status-only assertive hacks — rejected in SPEC Won't-do until a named AT defect requires them.
- `as` prop on the host — out of scope per SPEC "Do not duplicate" row.

## Walkthrough notes for HQ

- Most important #1 is decision 2 (export freeze): today any app can mount a second `AnnouncerHost` and double-speak — in Book open the ReferenceLibrary story, count `[data-reference-announcer-host]` nodes in devtools (must be exactly 1), and weigh whether the host stays importable.
- Most important #2 is decision 5 (multi-document product path): iframe/microfrontend apps need to know where hosts live — try untargeted `announce("Nope")` in the console with two hosts mounted and watch the diagnostic; then decide whether ReferenceLibrary-per-document is the topology.
- Most important #3 is decision 4 (diagnostic gating): the ambiguous-call warning fires in production on every call — compare with Toast's dev-only diagnostic and confirm the "one development diagnostic" freeze wording holds.
- Minor doc debt, not a decision: `README.md` still describes sticky `activated` as the current engine ("a production blocker") although landing fixed it — needs a one-paragraph refresh when SPEC defects 1–3 are reworded as fixed.
