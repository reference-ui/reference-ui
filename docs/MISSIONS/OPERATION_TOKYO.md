OPERATION: BRIEFED

# Mission: Operation Tokyo — reference-neo architecture reckoning

**Status**: `briefed` (HQ 2026-09-23). This is the plan file, not a plan
yet — the big plan gets written here once the stability gate below is
green. No Neo rearchitecture begins until then. Signal protocol (line 1
of this file): `OPERATION: BRIEFED` = HQ's thesis recorded, stability
gate pending; `OPERATION: READY` = gate green, plan writable;
`OPERATION: GO` = HQ authorizes the rearch slices in order.

Predecessor: [VOYAGE](VOYAGE.md) (parked 2026-09-23; Obj1/Obj3 COMPLETE,
Obj2 one gate out). Domain: `packages/reference-neo` (fragments,
publish, runtime, sync — everything above the RS cut).

## 0. The ground rule (HQ, verbatim in spirit)

The chain is broken if it is not working EXACTLY how it used to work.
No rearchitecting until it works: native green AND hermetic green AND
matrix green, everything passing, stable point reached. Then — and only
then — the rearch. Stability first, architecture second, in that order,
no exceptions.

## 1. HQ's thesis on Neo (recorded 2026-09-23)

- Reference RS has proved its point, loudly. What remains there is doom
  testing, which is night work. The next daytime effort is Neo.
- `sync` is a kitchen sink. It does not carry the vibes reference-core
  carried. Core did something heinous — no doubt — but at least it was
  architected properly.
- Neo's proposition is much simpler than core's ever was: just use the
  native stuff. The architecture should be simpler than core's, not
  messier.
- Massive red flags are already visible in the current shape (to be
  catalogued in §4, not asserted here).
- Core did things that would have saved hassle here — e.g. PostCSS as a
  real package in the pipeline rather than whatever Neo currently does
  about it. The old core is the reference library for this operation:
  steal its good bones, leave its heinousness behind.

## 2. Stability gate (the door to this operation)

All must hold before `OPERATION: READY`:

1. HERMDIV root cause confirmed hermetically (interim: fixtures
   externalize `@reference-ui/react` without shipping a bundle; native
   resolves fixture `css` to the fixture's own junction, container to
   the consumer's — see [LOG-2](LOG-2.md) `## HERMDIV interim`).
2. Fix landed, chain T1–T13 green natively AND hermetically (modulo the
   8 triaged D17 parks, which are a design ruling, not breakage).
3. Full matrix + Neo case suites green. No red anywhere that isn't a
   named, HQ-accepted park.
4. Voyage Obj2 closed (landing sweep done), or formally handed to Tokyo
   by HQ — either way, written down, not assumed.

## 3. Chain custody (why the tests stay)

There was a thought, once, to dissolve the chain tests into lib. That
thought is dead: the chain tests just caught a real native/hermetic
divergence that native-only testing would have shipped blind. The chain
sits firmly in Neo's remit, and its tests are the contract. Tokyo may
move them, harden them, add parity probes — it may not delete them
without HQ saying so out loud.

## 4. Red-flag catalogue (to be filled — survey phase)

- SYNC-ARCH: sync/ as kitchen sink — enumerate every responsibility
  currently inside `sync()` and its legs; propose the cut lines.
- CORE-BONES: old-core practices worth stealing (PostCSS packaging,
  pass boundaries, diagnostics discipline) — one entry each, with the
  file that proves core did it.
- PUBLISH-SHAPE: what publish emits vs what consumers resolve
  (HERMDIV fallout: junctions, externals, shipped bundles).
- NATIVES-SEAM: what crosses the RS cut, and whether the seam is typed
  narrow or leaking.
- Each entry: claim, file:line evidence, cost-of-ignoring. No vibes
  without evidence.

## 5. The big plan (written at READY, not before)

Phases, slices, gates, and the rearch order go here once §2 is green.
Standing constraints carried forward: chain tests stay (§3); Neo never
imports core/lib paths (agent-neo import boundary); every slice lands
behind the agent-neo gate (`pnpm agentneo q`) plus its cases; hermetic
chain tiers re-gated after any publish/runtime touch.
