# <Component> — DECISIONS.md template (quarantine-landing)

Every per-component DECISIONS.md follows this shape exactly. No placeholders:
`TBD` is forbidden — each item is complete or omitted with a stated reason.
Audience: HQ walking the catalog asking "what functionality are we missing?"

---

# <Component> decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: what this component is (base API in 10 words).

## Landed (context, 2-4 lines)

What the quarantine-landing arc did: wins ported, tests added, visuals verdict.
Pointer to the crew log (`.agents/missions/quarantine-landing/<log>.md`) and
the landing commit hash.

## Candidate features (quarantine-sourced)

One `###` section per candidate extra API / functionality quarantine surfaced:

### <n>. <Name> — verdict: DECLINED | DEFERRED | OPEN

- **Source:** quarantine commit + file + case IDs (or "no case ID" if none).
- **API sketch:** concrete props/parts/behavior it would add (a few lines).
- **Why not landed:** the landing reason (mangling? rewrite? feature-needs-design?
  matrix-only? unreferenced theater?).
- **Revisit when:** the concrete trigger that would reopen it.
- **Open questions:** product/UX questions HQ must answer first (may be "none"
  for hard DECLINED, with the one-line killer reason instead).

## Suspected gaps (no quarantine source)

Same `###` shape for functionality that looks missing but quarantine never
addressed. Source becomes **Evidence:** (consumer pain, sibling handoff,
a11y finding — with file/line or log pointer). Omit the whole section if
there are genuinely none — say so in one line.

## Non-decisions (rejected outright)

One line each: mangling-class items not dignified with a section
(controlled-only rewrites, renames, chrome removal) + pointer to where the
rejection is recorded (log/SPEC section).

## Walkthrough notes for HQ

2-5 bullets: the 3 most important decisions (by user impact), and what HQ
should look at / try in Book to feel each one.
