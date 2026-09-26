# Popover decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Controlled, anchored, non-isolating floating content with hover policy.

Open/mechanical follow-ups live in `PATCHES.md` (currently none);
open/design follow-ups live in `FEATURES.md` (currently none).

## Landed (context, 2-4 lines)

No quarantine freeze and no landing crew: quarantine's 18 freeze commits
(`QUARANTINE_RECON.md` §1) never touched Popover, so there is no crew log
and no landing commit. Popover stands on its pre-existing Gate 4 arc
(Overlay kernel + safe polygon + impatient click, `PO-HOVER-*` proven).

## Candidate features (quarantine-sourced)

Quarantine sourced no Popover freeze, hence no Popover candidates — except
one adjacent question where quarantine's Menu rewrite implicated Popover:

### 1. Popover as Menu composition root — verdict: DECLINED

- **Source:** quarantine commit `42b1a2c35` (Menu freeze), which rewrote Menu
  on a Popover root; no case ID (a Menu architecture choice, not a case).
- **API sketch:** no Popover API change — Menu would have consumed Popover as
  its root instead of composing Overlay directly. Popover keeps owning open
  state, placement, portal, and Presence exit for its own tree only.
- **Why not landed:** Menu crew rejected the rewrite as SUSPECT (do not port)
  in `.agents/missions/quarantine-landing/menu.md` (Triage line); Menu stays a
  direct Overlay consumer with its uncontrolled API untouched.
- **Revisit when:** Menu submenus need a cascading layer/placement model that
  Overlay alone cannot serve — even then the composition question belongs to
  Menu/Overlay, not to a Popover API addition.
- **Open questions:** none. Killer reason: quarantine's Menu-on-Popover root
  was a rewrite, not a feature, and Menu's landing proves the current
  composition without it.

## Suspected gaps (no quarantine source)

None evidenced: Gate 4 SPEC is fully proven or explicitly Won't do, and no
sibling handoff names missing Popover functionality (Menu's unproven
`MN-DOM-08`/`MN-DOM-10` submenu-placement need points at Overlay, the
geometry kernel, not at Popover).

## Non-decisions (rejected outright)

None — quarantine never touched Popover files (no Popover freeze in the §3
inventory; §4 drive-bys name only Backdrop/Showcase/index), so there are no
mangling-class items to reject. Recorded here and in `QUARANTINE_RECON.md`.

## Walkthrough notes for HQ

- Open items: none on either track — `PATCHES.md` (mechanical) and
  `FEATURES.md` (design) each record the honest none-line.
- The only decision is the DECLINED Menu-on-Popover root: open Menu's
  StandardDropdown story and Popover's story side by side — both ride Overlay
  directly, and neither needs the other as a root.
- HoverCard is Popover + `openOnHover`, not a primitive: try the Popover
  hover story (diagonal pointer travel into Content stays open via the safe
  polygon) to feel the one behavior Popover owns outright.
- Everything else (flip/shift/arrow, dismiss stack, Tab bridge, Presence
  exit) is Overlay's: any placement or dismissal question HQ has belongs on
  Overlay's walkthrough, not here.
