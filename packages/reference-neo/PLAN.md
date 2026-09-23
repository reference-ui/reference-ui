# Neo Plan — post-voyage polish (Tokyo era)

> Status: **thinking doc**. Restarted 2026-09-23 by HQ: the 2026-09-17
> parity campaign below is superseded (see git history for the 1410-line
> original). RS has proved its point; nights are doom-testing; days are
> Neo. This file is where the Neo rethink happens.

## 0. Where Neo stands

- Neo is the TypeScript above the RS cut: fragments, publish, runtime,
  sync, and the generated folder consumers import. (~197 cases, ~320
  unit tests — re-verify with `pnpm agentneo list` and the suite.)
- Voyage record: Obj1 (reference + tasty bridge) and Obj3 (lib sync
  648→319ms) landed. Obj2's packed-extends merge landed and is green
  natively (23 chain flips); hermetic diverges (HERMDIV interim in
  [LOG-2](../../docs/MISSIONS/LOG-2.md): fixture `css` resolves to the
  fixture's own runtime natively, the consumer's in-container).
- Operation Tokyo ([brief](../../docs/MISSIONS/OPERATION_TOKYO.md)) owns
  what comes next. Its ground rule: nothing architectural moves until
  the chain is green native AND hermetic AND matrix. Stability first.
- Evidence museum: `packages/reference-legacy/` (frozen `main` core,
  read-only law in its README). Tokyo steals solved structure from it;
  nothing imports it.

## 1. HQ's thesis (the shape of the rethink)

- `sync` is a kitchen sink. Core did something heinous but was
  architected; Neo's proposition is simpler (just use the native
  stuff) and its architecture should be simpler than core's, not
  messier.
- Past the compiler, these are solved problems — structure, pass
  boundaries, packaging, diagnostics. Don't re-derive from ground
  principles what core already ironed out. Steal the bones (PostCSS
  packaging et al), leave the heinousness, filter the panda-isms by
  writing the after photo in Neo.
- The chain sits firmly in Neo's remit. Its tests are the contract:
  harden and probe them, never dissolve them.

## 2. Sequencing

1. **Stability gate** (Tokyo §2): HERMDIV confirmed + fixed, chain green
   everywhere, suites green, Obj2 closed or handed over.
2. **Survey**: fill Tokyo §4 (red-flag catalogue) — sync's
   responsibilities enumerated, CORE-BONES entries with legacy
   file:line, publish-shape and natives-seam mapped.
3. **The big plan**: written in Tokyo §5 at READY, slices in order,
   every slice behind `pnpm agentneo q` + cases + hermetic re-gate on
   publish/runtime touches.

## 3. Open questions (think here)

- What are sync's actual responsibilities today, one per line? Where
  are the cut lines — what becomes passes, packages, or deleted code?
- What did core's PostCSS/packager/sync-session shape get right that
  Neo's publish legs should adopt? (Cite legacy file:line, not memory.)
- What is the narrowest typed seam across the RS cut? What leaks today?
- Hermetic/natives: what must be byte-identical across platforms, and
  what is allowed to differ? (HERMDIV fallout.)
- What does "Neo is done" mean — what is the smallest complete Neo?

## 4. Standing constraints (carried, not re-debated)

- Chain tests stay. Neo never imports core/lib/legacy paths. Cases +
  Playwright prove behavior; goldens prove strings. No matrix/Dagger in
  the inner loop; hermetic tiers re-gate publish/runtime changes.
- Workflow: [agent-neo](../../.agents/skills/agent-neo/SKILL.md)
  (`pnpm agentneo`). Cases live in `tests/`; the index in READMEs.
