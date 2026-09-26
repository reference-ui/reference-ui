# Button decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Native-button primitive (`type`, `variant`, `disabled`, icons) from `@reference-ui/react`.

## Landed (context, 2-4 lines)

Nothing: Button had no quarantine freeze (absent from all 18 freeze commits
in `docs/MISSIONS/QUARANTINE_RECON.md` §1/§3), so there was no landing crew,
no crew log, and no landing commit. Current coverage is the pre-existing
`ButtonStatesFixture` story plus `Button.ct.spec.ts`.

## Candidate features (quarantine-sourced)

Moved to [FEATURES.md](./FEATURES.md) (design-needing) and [PATCHES.md](./PATCHES.md) (mechanical).

None — no freeze commit means quarantine surfaced no Button API to judge.

## Suspected gaps (no quarantine source)

Moved to [FEATURES.md](./FEATURES.md) (design-needing) and [PATCHES.md](./PATCHES.md) (mechanical).

None evidenced — no SPEC/TESTS docs, no recon mention, and no sibling crew
log hands Button an API question.

## Non-decisions (rejected outright)

None — nothing was proposed, so nothing was rejected.

## Walkthrough notes for HQ

- There are no Button decisions to walk through; open `Button → States` in
  Book to confirm the three variants, disabled states, and icon slots render.
- Open follow-ups, if any accrue, live in [PATCHES.md](./PATCHES.md) (mechanical) and [FEATURES.md](./FEATURES.md) (design-needing); both are currently none.
- Adjacent only, not a Button gap: Field's log notes a double ring when a
  nested button takes keyboard focus (`.agents/missions/quarantine-landing/field.md`,
  theme-crew follow-up) — owned by Field/theme, no Button API change implied.
