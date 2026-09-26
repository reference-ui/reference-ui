# Icon decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: sized SVG glyph set (`small`/`base`/`large`) plus control-integration patterns.

## Landed (context, 2-4 lines)

Icon had NO quarantine freeze and NO landing crew: there is no crew log and
no landing commit. The Book story (`Icon.book.tsx`) documents the sizing
tokens and optical-integration patterns as they shipped outside the
quarantine arc.

## Candidate features (quarantine-sourced)

No quarantine freeze touched Icon, so quarantine surfaced zero candidate APIs; no quarantine-adjacent API question was found in recon or sibling logs.

## Suspected gaps (no quarantine source)

No evidenced functionality gaps — Icon is a sizing/integration story with no SPEC/TESTS contract and no consumer pain or handoff on record.

## Non-decisions (rejected outright)

- None: with no freeze, nothing was proposed against Icon and nothing needed rejecting.

## Walkthrough notes for HQ

- Nothing is pending a decision; the only walkthrough question is whether the current token scale (`small` 16px / `base` 20px / `large` 24px) still feels right — open the Icon Overview story in Book and check the three sizing tokens card.
- If HQ wants a future decision surface, the trigger would be a new ask (e.g. more sizes, custom glyph registration) arriving with a consumer case — none exists today.
