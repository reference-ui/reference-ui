# Reaper READY ask 3 — leaf-only vs unbound, read-only

Date: 2026-09-20. Author: Reaper Phase R1 crew (read-only).
Mission: `docs/missions/operation-reaper.md` READY ask 3.

## Verdict: NO occurrence-level split today — but YES an exact value-level bound, read-only, with no code changes.

## Why the exact split is unavailable

The two passes never meet. The site walk binds complete `(prop, value, when)` leaves
into wants carrying `file` + `line`/`column` of the span start
(`walk/mod.rs::push_want`, `walk/mod.rs:68-85`) — but spans are transient: consumed for
the line/col conversion and never retained. The pool visitor is a separate,
position-free pass over the same ASTs (`literals.rs:1-7`); `HarvestPool::insert` keeps
the trimmed string in a `BTreeSet<Box<str>>` per kind and drops the span at the door
(`literals.rs:39-44`). There is no join key between "this pool string" and "that bound
leaf" at the occurrence level. `literals.rs` + the site walk cannot report it today —
Slice 2's span-reporting change is genuinely new capability, not exposed plumbing.

## The read-only bound (no code moves)

Join at the value level, both sides available read-only (ask 2):

- `P` = pool set by kind, from the Rust test reader over the fixture dir.
- `L` = distinct string values of site wants (`CompileResult.wants` where
  `origin != 'harvest'`, `AtomValue::String` only).
- **Definitely-unbound** `= P − L`: exact. No bound leaf ever held these strings, so
  every occurrence that pooled them was unbound.
- **Ambiguous** `= P ∩ L`: an **upper bound** on leaf-only. Each of these strings was
  bound as a leaf *somewhere*, but may also occur unbound elsewhere — read-only cannot
  separate the two populations.

D1 wants "how many pool values exist only as static style leaves". Read-only delivers
`leaf-only ≤ |P ∩ L|` plus the exact `|P − L|`. If the ambiguous set is already small
relative to the pool, D1 can weigh Slice 2's doctrine cost against a bounded prize
without further instrumentation. If it is large, the exact split needs Slice 2's
span reporting (walk reports bound-leaf spans; pool visitor skips them — the mission's
Slice 2 plan, unchanged by this ask).

Note the fixture (ask 1) designs both populations in: half the hexes live only in the
unread palette (must land in `P − L`), half are re-used as static leaves (must land in
`P ∩ L`). SEAM-07's 500 hexes are the live precedent for the ambiguous set — each is a
static `css({ color })` leaf that also pools (`ATM-SEAM-07/spec.ts:18-24`).

## Recommendation for Slice 1

Report the triple `(|P − L|, |P ∩ L|, |P|)` by kind in `reaper-01-real-compile.md` and
let D1 read the bound. Do NOT build span tracking as "census tooling" — that is Slice 2
wearing read-only costume, and it spends the doctrine change before D1 is answered.
