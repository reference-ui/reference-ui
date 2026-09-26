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

### 1. Cross-document trapping (`crossFrame`) — verdict: DEFERRED

- **Evidence:** `SPEC.md` Deferred + `FocusLock.md` Shadow DOM section: "a lock
  never traverses frame content or traps across Documents"; `FL-NEST-06` /
  `FL-CAND-12` / `FL-CAND-14` pin one lock stack per Document.
- **API sketch:** an opt-in (e.g. `crossFrame`) letting an outer lock contain
  focus inside same-origin iframe content instead of treating the `<iframe>`
  element as one opaque stop.
- **Why not landed:** deliberately outside the freeze — per-Document stacks are
  the shipped contract; cross-origin traversal is impossible by platform design.
- **Revisit when:** a real consumer needs nested same-origin iframe dialogs
  contained by one outer lock.
- **Open questions:** none for the deferral itself — the boundary is explicit.

### 2. TalkBack virtual-modality skip — verdict: DEFERRED

- **Evidence:** `SPEC.md` ("TalkBack virtual-modality skip is **not** a
  production blocker. Park it."), Deferred section, and Gate 3 work order
  ("TalkBack stays parked").
- **API sketch:** no new props — internal skip of virtual-modality handling on
  Android Chrome TalkBack (cf. Aria's skip), behavior-only.
- **Why not landed:** parked as non-blocking; no consumer pain evidenced.
- **Revisit when:** an a11y audit or TalkBack user report names a concrete
  failure inside a locked dialog.
- **Open questions:** none — needs a repro, not a product decision.

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
- `crossFrame` is the only structural gap, and it is a deliberate boundary,
  not an oversight: open the Book FocusLock story with an iframe fixture and
  Tab — the frame is one stop, inner content untouched.
- TalkBack skip is parked with no repro — HQ should NOT reopen it without one.
- Non-decisions (no wrapper, no `as`, no autofocus DSL) are the load-bearing
  taste calls — feel them via any Dialog story: trap works with zero extra DOM.
