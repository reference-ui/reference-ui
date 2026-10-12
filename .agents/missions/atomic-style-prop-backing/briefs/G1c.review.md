# G1c — transitive upstream qualifiers (T17 blocker): ratify the corrected C13

Reply `STATUS: DONE` (ratified) or `STATUS: REVISE` (itemized) first line. Read-only.

## Finding (the T17 acceptance test caught it)

T17 is **RED** on the landed engine: the consumer never emits `reference-icons__*`
rules, so a prebuilt icon reached **transitively** (through lib's `layers`) stays
unbacked — the icon faints and warns `no compiled class`.

**Root:** `packages/reference-neo/src/sync/index.ts:156` derives
`upstreamSystems = deduped([...extends, ...layers].map(s => s.name).filter(n => n !== spec.name))`
— **T06 / G0 C13, frozen verbatim**. For T17 (`extends: [lib]`, `layers: [fixture]`)
that yields `["reference-ui","aliased-host-library"]`. `reference-icons` exists only
as a **nested stream** inside lib's `BaseSystem.streams`, never as a direct `.name`,
so it is never a qualifier. Measured: page has the canonical 7 icons rules and **no**
probe rules; `unbacked = [reference-icons__c_t17ProbeInk, …c_#b70233, …c_#00b7ab, …hover:c_#00b7ab]`.

**This is the mission's motivating case.** `STYLE_PROP_EXTERNAL` §1: docs styling
`<BoltIcon color=…>` where icons arrive **transitively** (docs extends lib; lib layers
icons). `.name`-only is the outlier — `BaseSystem.streams` is documented
**transitively expanded** (`system/base/types.ts:32`), and `hasUpstreamContainerRoot`
already scans `.streams` for exactly this reach (`system/base/container-root.ts:40`).

**Test-side workaround rejected:** layering icons directly makes the probe rule
appear but prints the icons canonical 7 **twice** (lib already nests the icons
stream) → fails G1 §4's "duplicates in neither" accounting.

## Verified fix (crew experiment; `handoffs/T08.md` §6 — NOT landed)

```ts
const upstreamSystems = deduped(
  [...(config.extends ?? []), ...(config.layers ?? [])]
    .flatMap((system) =>
      system.streams && system.streams.length > 0
        ? system.streams.map((stream) => stream.name)
        : [system.name]
    )
    .filter((name) => name !== spec.name)
)
```

- T17 → `upstreamSystems: ["reference-icons","reference-ui","aliased-host-library"]` → **14/14 green**; accounting = canonical 7 ∪ consumer-own probe stems 5, each exactly once, `duplicates == []`.
- **Byte-identity:** no-upstream worlds have no `streams` → `.name` fallback → unchanged; T16 (nested icons, no external wants) unchanged **6/6**.
- Mirrors the existing `.streams` scan; `.name` fallback keeps older/hand-authored baseSystems working.

## Secondary (captain-run, not code)

The **hermetic** T17 additionally needs the **republish base systems** step of the
re-sync chain; until then native fresh-`ref sync` is the authoritative evidence
(the hermetic image consumes a stale published base system).

## Ask
1. **Ratify the transitive derivation** (qualifier names from each upstream's transitively-expanded `streams`, `.name` fallback) as the **corrected C13**, and the change surface.
2. Confirm the byte-identity argument (`.name` fallback for no-upstream; T16 unchanged).
3. Confirm the hermetic gate requires the **republish** step, and native fresh-sync is authoritative until it runs.
4. Confirm the landing owner/scope (`sync/index.ts`; a small crew; lands in C1) and that T17 flips green afterwards, unlocking W4/G2.
