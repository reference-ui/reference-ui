# Mission: Full StyleTrace

Status: `active` — voyage opened 2026-09-18 on the full-parity commit.

## The idea

Engine gaps are scary because the capability boundary is tribal knowledge.
Doom agents will need that boundary as starting context — the rules of what
Reference can and can't do (Panda-like constraints, extended where we go
further). Before Doom, the boundary must become real instead of listed.

The concrete next journey: bring StyleTrace fully up to speed until it is
the perception layer that makes hand-lists unnecessary.

## The sharp end

`ui.config.ts` hand-lists `jsxElements` today (the B7 one-liner: custom
hosts like `MonoText`). That list should not exist — discovering which JSX
elements carry style props is precisely StyleTrace's job. The mission:

1. Snapshot the component set as the witness baseline.
2. Drive StyleTrace to full discovery of styled JSX elements.
3. Delete `jsxElements` from `ui.config` with zero snapshot drift.

## Captain's notes (not planned, just recorded)

- This is the oracle loop applied to perception: snapshots pin behavior,
  the engine change must not move a pixel.
- The `jsxElements` deletion is the acceptance gate, not the work — the
  work is whatever StyleTrace gaps the snapshots reveal along the way.
- Feeds the [test index](test-index.md) (discovered capabilities become
  searchable) and the [Doom agent](doom-agent.md) (the boundary becomes
  Doom's starting context). The three missions compose.
