# FocusLock decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: invisible focus trap (Tab loop, reclaim, restore) slotted onto one child.

## Landed (context, 2-4 lines)

FocusLock had NO quarantine freeze commit and NO landing crew: there is no
crew log and no landing commit. Quarantine diffstat on `FocusLock/` is empty
(recon §3 lists 18 freezes, slot → date-field; FocusLock is not among them),
and the Overlay crew confirmed zero quarantine pressure on the
FocusLock↔Overlay coupling either way (`objective-B-overlay.md`).
Gate 3 shipped pre-quarantine: Overlay×FocusLock Must 1–5 plus solver,
resilience, and exotica proven (`SPEC.md` Status 2026-09-09).

## Candidate features (quarantine-sourced)

None — quarantine never froze FocusLock, so it surfaced no candidate API.

## Suspected gaps (no quarantine source)

Moved out of this file:

- Gap #1 (`crossFrame`, DEFERRED) → `FEATURES.md` §1 — needs an API-surface design call.
- Gap #2 (TalkBack virtual-modality skip, DEFERRED) → `FEATURES.md` §2 — parked without a repro, not test-pinnable today.
- `PATCHES.md`: none — nothing deferred is mechanical (see the honest none-line there).

## Non-decisions (rejected outright)

- `as` / wrapper node / public focus guards / sidecars / groups / whitelist
  callbacks / combining two trap engines — recorded in `SPEC.md` Out of scope
  and `FocusLock.md` convergence table (`FL-DOM-01`–`03` pin the no-wrapper contract).
- `autofocus` / `data-autofocus` DSL — left in `FocusLock.md`; omitted
  `initialFocus` is first-tabbable (`SPEC.md` Won't do).
- tabbable `displayCheck` modes as public API — excluded in `FocusLock.md`
  tabbable catalog and `SPEC.md` Must 5.
- Restore-on-unmount timing — left in `FocusLock.md`; restore runs only at
  owner deactivation / Presence completion (`SPEC.md` Freeze, Presence).
- `ReferenceSlotPartProps` / StyleProps merge — not a public export; would
  violate `FL-DOM-02` (`SPEC.md` Won't do, `FL-TYPE-01` proves the real unions).

## Walkthrough notes for HQ

- The headline is the absence: nothing to decide from quarantine — FocusLock
  is the null-quarantine primitive alongside Overlay.
- Mechanical patches: none — see `PATCHES.md`.
- Design gaps: two deferred items in `FEATURES.md` — `crossFrame` (§1, the
  only structural gap, a deliberate boundary: open the Book FocusLock story
  with an iframe fixture and Tab — the frame is one stop, inner content
  untouched) and TalkBack skip (§2, parked with no repro — do NOT reopen
  without one).
- Non-decisions (no wrapper, no `as`, no autofocus DSL) are the load-bearing
  taste calls — feel them via any Dialog story: trap works with zero extra DOM.
