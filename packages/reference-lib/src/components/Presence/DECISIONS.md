# Presence decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: exit-lifecycle gate that keeps unmounting children until CSS effects finish.

## Landed (context, 2-4 lines)

Quarantine-landing ported the full source stability delta (multi-effect parsing,
nested/SSR fast path, descriptive throws, completion gate, stable refs, child
validation), the 11-case colocated suite (vacuous PR-DOM-08 strengthened), and an
additive Book story; visuals frozen, UX sign-off. Crew log:
`.agents/missions/quarantine-landing/presence.md`; landing commit `7c8c79c15`.

## Candidate features (quarantine-sourced)

Quarantine added no new public props — the full source delta was landed and the
matrix fixture uses `present` + children only — so this section holds the single
functionality ruling quarantine's SPEC tried to make. Quarantine's 48/48 proof
claim, `Production: Yes`, and nested-registration "Done" are proof-status claims,
not API, and were deliberately not copied (they rest on out-of-scope matrix
proof); they are omitted here, not decisions.

### 1. GSAP completion wait as documented extension — verdict: OPEN

- **Source:** quarantine commit `77ea89ba0`,
  `packages/reference-lib/src/components/Presence/SPEC.md` ("Frozen as
  progressive enhancement"), no case ID.
- **API sketch:** no new props — a documented behavior contract: Presence keeps
  waiting on `finiteGsapTweens(el)` (GSAP-driven exits hold unmount alongside
  CSS effects), blessed as deliberate rather than tolerated, presumably with a
  `PR-*-GSAP` case if HQ wants it proven.
- **Why not landed:** landing kept the GSAP code paths (including the
  reduced-motion gate) but refused the status claim: the freeze is CSS-only per
  SPEC.md "Gaps & incoherence" ("Document that as a deliberate extension or
  remove it"), and blessing a third-party animation library as a supported exit
  driver is an HQ product call, not a landing call.
- **Revisit when:** HQ rules one way or the other — either name GSAP a supported
  exit driver (then document it in Presence.md + add a case) or delete
  `finiteGsapTweens` and its branches outright.
- **Open questions:** is any in-repo consumer (Collapsible measured-height work
  is the rumored one) actually driving exits through GSAP today, and does HQ
  want a GSAP dependency in Presence's contract at all?

## Suspected gaps (no quarantine source)

### 1. `forceMount` / keep-mounted escape hatch — verdict: DECLINED

- **Evidence:** the catalog-walker reflex ("Radix has `forceMount`, where is
  ours?"); explicitly refused by `Presence.md` §"`forceMount`", SPEC.md
  "Next agent" ("No public `forceMount`"), SPEC.md "Vendor / Leave", and
  TESTS.md "Out of scope".
- **API sketch:** what HQ would be asking for: `forceMount?: boolean` keeping
  the child rendered regardless of `present`, for pre-mounting or measuring
  hidden content.
- **Why not landed:** killer reason — Overlay already keeps children mounted
  through exit via Presence internally, which is the only sanctioned
  keep-mounted need; a public prop would bless consumers holding hidden
  subtrees outside the exit machine, bypassing exactly the lifecycle Presence
  exists to own.
- **Revisit when:** a consumer shows a pre-mount/measure pattern that cannot be
  expressed as "render it present inside a hidden parent" — no such case has
  surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 2. Enter/leave class orchestration — verdict: DECLINED

- **Evidence:** refused by `Presence.md` ("**Leave** Headless enter/leave class
  orchestration as a public API"), SPEC.md "Next agent" ("no enter/leave class
  API") and "Won't do" ("Visual enter/leave classes"), SPEC.md "Vendor / Leave",
  and TESTS.md "Out of scope".
- **API sketch:** Headless-style `enter` / `enterFrom` / `enterTo` / `leave` /
  `leaveFrom` / `leaveTo` class props (or a `data-state`-free class state
  machine) applied to the child across mount and exit.
- **Why not landed:** killer reason — Reference UI animates against
  consumer-owned `data-state` (`open`/`closed` set by the consumer before
  Presence decides removal); a parallel class API would give every exit two
  styling owners and fork the contract Overlay, Popover, and the COMP cases
  already prove against `data-state`.
- **Revisit when:** a composition proves unreachable via `data-state` selectors
  against consumer CSS — the three COMP compositions (fade, drawer, reduced-motion
  reopen) suggest the selector contract covers the space.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 3. Render-prop state / `appear` enter orchestration — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Out of scope" ("render-prop state, `appear`");
  `Presence.md` §"`forceMount`" notes "Radix render-prop always renders" as the
  contrast deliberately not taken.
- **API sketch:** `children` as a function receiving mount/exit state, and/or an
  `appear` prop running an enter animation on first mount.
- **Why not landed:** killer reason — Presence owns *exit* lifecycle only;
  enter styling is already expressible as plain CSS on the mounted child
  (mount it and animate), so render-prop state would add API surface for
  information the consumer's own `present` boolean already holds.
- **Revisit when:** an enter pattern needs machine state the consumer cannot
  derive from `present` plus mount (e.g. distinguishing first-mount enter from
  re-enter after a canceled exit *inside* the child) — no such case has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 4. Presence-owned host node / `data-state` — verdict: DECLINED

- **Evidence:** refused by TESTS.md ¶1 ("renders no host and does not set
  `data-state`; the consumer sets closed state before Presence decides when to
  remove the child") and SPEC.md "Next agent" ("no extra host node");
  `PR-DOM-01` and `PR-DOM-04` prove the transparency.
- **API sketch:** Presence rendering a wrapper (or stamping `data-state` onto
  the cloned child itself) so consumers need not set closed state before
  toggling `present`.
- **Why not landed:** killer reason — transparency is the component's identity:
  a wrapper breaks "no wrapper or sibling" layout guarantees, and self-stamped
  `data-state` would race the consumer's own state attribute that CSS already
  keys off; the current order (consumer sets closed, *then* Presence times
  removal) keeps exactly one styling owner.
- **Revisit when:** never as default behavior — if authoring friction ("I forgot
  to set closed state") proves chronic, the answer is a lint or a recipe doc,
  not a host (itself a new decision).
- **Open questions:** none — hard DECLINED (the one-line killer above).

## Non-decisions (rejected outright)

- No mangling-class items exist for Presence: no uncontrolled mode to delete
  (`present` is controlled by design), no chrome/motion to strip (renders no
  host), no renames — recon §4 exhibits never touch Presence source; crew log
  "Triaged" (full delta ported as stability wins).
- Quarantine's vacuous PR-DOM-08 title (caught the error, never asserted it) —
  strengthened with an assertion at landing, a test repair not a product
  decision; crew log "Surprises".

## Walkthrough notes for HQ

- Most important: candidate §1 (GSAP wait — OPEN) — the only undecided behavior
  in the component; the code is live but the contract is not. Decide bless or
  delete before any consumer leans on it; try nothing in Book, read the SPEC gap.
- Second: suspected §4 (no host / no self-stamped `data-state` — DECLINED) — the
  decision that *defines* Presence; try the Book Default story (toggle Hide/Show)
  and note the panel you see is 100% consumer markup that Presence merely retains.
- Third: suspected §1 + §2 (`forceMount`, class orchestration — DECLINED) — if HQ
  wants either, that re-founds Presence as an animation orchestrator rather than
  an exit gate; read both killer reasons before asking.
- The landed reduced-motion behavior change (JS media-query branch removed per
  PR-INSTANT-05; exits now follow computed CSS) is already UX-approved and needs
  no walkthrough ruling — it is context, not backlog.
