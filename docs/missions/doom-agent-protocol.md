# DOOM-AGENT PROTOCOL (armed, runs after Operation Overmatch)

Status: ARMED — trigger: `overmatch-ledger.md` (Ph5) exists AND the
satisfaction marker `docs/evidence/doom-armed.md` exists. A polling cron
checks both; the marker is written only on the user's explicit
"satisfied" signal. Neither condition may be inferred.

## 1. Objective

Red-team `packages/reference-neo` and `packages/reference-rs` after
Overmatch closes. Doom agents try to break the system, findings are
reviewed, real breaks are fortified (tests formalized + implementation
fixed). Goal: a compiler-grade system that survives real users.

## 2. Persona: QA engineer, not vandal

The doom agent uses the system as a real user would and predicts what a
user would do to break stuff. Perspective is always "a user might do X".
Breakage that no real user would ever produce is contrived and dies in
review. Doom agents have incentive to break shit; review exists to keep
them honest.

## 3. The one domain rule (build-time compilation)

This is a build-time CSS compiler. Attacks that are obviously
incompatible with build-time extraction (color tokens from a server
endpoint, runtime-only values) are out of scope — no review needed.

The standing extractability rule: if an author defines information in
one or many files — constants, spreads, imports, re-exports, whatever —
it should be extractable. Doom agents working atomic styles hold the
system to exactly that.

## 4. Target layers (prime crews per layer, then vertical)

- Neo playground (fastest iteration loop for break/fix cycles).
- Neo Playwright tests — preferred for anything visual: full lifecycle,
  real browser, CSS actually rendered and painted.
- `reference-rs` unit tests (Rust domain crates).
- `reference-rs` case fixtures (atomic stations and siblings).
- Full vertical stack crews: break across layers at once (authoring →
  extract → resolve → emit → paint).

Prime layer crews first, then vertical crews. Many break areas exist
beyond atomic styles — crews are expected to find them.

## 5. The cycle (break → review → consult → fortify)

1. **Break.** Doom crew produces failing reproductions with minimal
   cases, each framed as "a user might do X".
2. **Contrivance review.** Every break is reviewed: would a real user do
   this? Contrived breaks are dropped with a one-line reason. No fix
   work on dropped breaks.
3. **Architect consult.** Real breaks go to architects or oracles FIRST.
   The fix shape is decided there, not in the implementation crew.
4. **Fortify.** Implementors fix per the approved shape; tests are
   formalized where useful (station, case, or unit — owning layer's
   call). Monkey-patching to make a test pass is forbidden: no loose
   code, no narrow special-cases that dodge the approved shape.
5. **Periodic review.** Each doom cycle ends with a review before the
   next cycle launches: what broke, what was contrived, what got
   fortified, what the next cycle targets. Minimum run: **6 cycles**
   (§8).

## 6. Safeguards

- Doom crews are read-break-only until a break passes contrivance
  review; they never touch `src/` on their own authority.
- All findings flow through review; volume of breaks is not a score.
- Fixes without an architect/oracle-approved shape are reverted.
- Cycle reviews gate the next cycle — no runaway doom loops.

## 7. First cycle (default if no narrower order given)

Cycle 1 primes four crews: (a) atomic-styles extractability across the
layer list above, (b) neo browser-paint breaks via Playwright,
(c) cross-file/import-shape breaks, (d) one full-vertical crew. Narrower
launch orders override this section. Launch each cycle as a role-split
multi-agent workflow (breaker / contrivance-reviewer / architect-oracle /
implementor crews with review gates between roles); check for a
workflow-authoring skill at launch time and follow it when present.

## 8. Satisfaction pin (what "happy tomorrow" means)

The doom run is a minimum of **6 full cycles** (break → review → consult
→ fortify → cycle review, per §5). Six clean cycles with every real
break fortified or architect-deferred is the starting pin for user
satisfaction. Fewer than six, or six with un-fortified real breaks and
no deferral ruling, does not earn the pin. The pin informs the
satisfaction marker — it does not replace the user's explicit signal.
