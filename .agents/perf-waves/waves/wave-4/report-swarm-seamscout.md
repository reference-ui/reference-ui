# seam-scout REPORT: N-API seam census on the enterprise sync load

## Identity

- Base: `c593829d3a2b6382d7150410a05a470159f40616` (`git rev-parse HEAD` verified first act; match, proceed).
- Method: lock-free first. All attribution from the FILED repro4a/b bundles
  (`docs/evidence/flamegraph/enterprise-repro4a+b/`, base `6f4cf1ba`) via the
  query layer (`pnpm agentrs flame --inspect`, compile/publish/all scopes).
  No fresh capture: `git diff --stat 6f4cf1ba..HEAD -- packages/` touches only
  MCP icons-search + tsup config + neo benchmark reports — ZERO changes under
  `packages/reference-rs`, so the filed seam attribution stands exactly on this
  base. No code changes, no diets, no bench lock, no commits.
- Load: seed-7 enterprise (3000 style + 12000 dead, 7527 `css()` calls, 1000 Hz samply).

## Grounding (fenced, not re-litigated)

- `PERF-W2-MARSHAL` [BANK] → landed via `INT-W2-SET3` [LAND] ("whole set:
  collect + proof + selpush + shorthand + marshal", integrate-set3.md:7).
  Harvested the result-leg duplication (−2.93 MB wire, `wire.rs` slim refold,
  landed in `native.rs`/`runtime.ts`). Its request-leg finding stands:
  `files[]` (5.66 MB) are LOAD — omitting them re-pays 15,122 disk opens ×
  15.87 µs ≈ 240 ms vs the whole 28.5 ms marshal delta (statically rejected);
  `spec` RawValue prize ~0.1 ms (ceiling-barred, dropped). Byte census below is
  MARSHAL's filed census, re-cited.
- Repro3 (report-swarm-repro3.md) marshal room: "napi frames ≤6; codec legs
  tiny-flat; publish stopwatch flat" — this scout re-derives every number at
  flame grain and extends to a full crossing census (counts MARSHAL never filed).

## Crossing census (static, exact)

Chain per `sync()` (each link verified by file:line):

```
sync (neo/src/sync/index.ts:81)
 → 1× compileNative(request) (:120, between compileStart/compileEnd marks)
 → 1× atomic.compile(request) (neo/src/sync/native.ts:77)
 → 1× compileSync → 1× JSON.stringify(request) (atomic/js/index.ts:44-47)
 → 1× compileSystem(requestJson) (atomic/js/runtime.ts:26-30)
 → 1× native.compileSystem(String) — the SOLE napi export
    (ATOMIC_NATIVE_EXPORTS=['compileSystem'], native.rs:38-39:
     compile_system(request_json: String) -> Result<String>)
 → serde_json::from_str (native.rs:46) → atomic::compile (native.rs:74)
 → serialize slim (native.rs:172-183) → 1× JSON.parse (runtime/js/native.ts:27)
 → slim refold concat (runtime.ts:36-39, lazy rope, ~0 ms per MARSHAL micro)
```

Counts:

| site | crossings / enterprise sync | basis |
| --- | --- | --- |
| `__napi__compile_system` (compile window) | **1** | single call site, serial `sync()`, no loop ("one native compile", index.ts:3) |
| per `css()` call | 1 / 7,527 | 7527 calls ride inside the one request |
| per file | 1 / 15,122 | 15,122 `files[]` entries ride inside the one request string |
| per phase: compile / scan / publish / config / evaluate | 1 / 0 / 0 / 0 / 0 | compile marks bracket the single call |
| other `__napi__` frames in sync window | **0** | whole-profile query ×2 captures: only `emit_dts` 1wt, in publish (typegen DTS, outside compile fence, noise grade) |

Flame corroboration: `__napi__compile_system` incl **500/500wt** in the compile
bucket (518wt) ×2 captures — a single edge carrying the whole window, zero
self. Count axis is OPTIMAL: floor is 1 (cannot compile natively in 0 calls).

## Conversion inventory (filed MARSHAL census + static shape)

napi values per sync: **2** (1 String arg + 1 String return), 1 call.
Objects/arrays/Buffers crossing napi: **0** — everything rides inside the two
JSON strings. Proof channel OFF on bench (no `logs` in sync request path).

| string | bytes | share / note |
| --- | --- | --- |
| request in (1 crossing) | 6,153,775 | `files[]` 5,662,338 (15,122 files, avg ~374 B) + `spec` 19,058 + framing/paths ~472,379 (derived by subtraction) |
| result out, dieted (1 crossing) | 3,144,558 | `stylesheet` 2,867,925 + `portableHead` 1,162 + `runtime` 214,325 + diag/hosts ~4 + framing ~61,142 (derived) |
| result out, pre-MARSHAL | 6,072,347 | portable full 2,867,982 (shared tail 2,866,820 = 99.96%, harvested) |

Codec paths: serde de (`from_str`→`from_trait`) + serde ser (`to_string` slim)
+ manual `wire::split_shared_suffix` (landed diet) + manual `spec_json_text`
re-serialize (19 KB, sub-sample) + V8 `stringify`/`parse` JS-side + manual
refold slice+concat (~0, lazy). serde vs manual: all bulk movement is serde/V8;
manual paths are the landed diet scan + the ~0 refold.

## Flame attribution: compile bucket 518wt, fully reconciled (wt ≈ ms)

Ledger closes EXACTLY both captures (4a: 475+25+18=518; 4b: 476+24+18=518):

| leg | 4a | 4b | self | mechanism |
| --- | --- | --- | --- | --- |
| `atomic::compile` (the work — dry rooms) | 475 | 476 | — | scouted ground, not seam |
| **in-napi, non-compile subtotal** | **25** | **24** | | |
| napi glue-in: FromNapiValue→`napi_get_value_string_utf8`→Utf8Length 2/2 + WriteUtf8V2 4/3 | 6 | 5 | 0 | byte copy of 6.15 MB request |
| napi glue-out: ToNapiValue→`napi_create_string_utf8`→NewFromUtf8 | 1 | 2 | 0 | byte copy of 3.14 MB result |
| serde de `from_trait` (4/3 direct + 1/1 via spec `from_json`) | 5 | 4 | 0 | JSON parse 6.15 MB |
| `serialize` slim (incl `split_shared_suffix` 2/2 diet scan) | 4 | 4 | 0 | JSON emit 3.14 MB |
| drops: `CompileResult` 7/6 + `CompileRequest` 1/2 | 8 | 8 | — | serde struct teardown (protocol-adjacent) |
| `BaseSystem::from_json` (spec lower) | 1 | 2 | 0 | 19 KB re-parse (RawValue prize 0.1 ms, dropped) |
| `free_medium` | 1 | 0 | — | noise |
| **JS wrapper in compile bucket subtotal** | **18** | **18** | | |
| V8 `JsonStringify` (request leg; MARSHAL micro 7.20 ms) | 11 | 11 | 0 | JSON emit 6.15 MB |
| V8 `JsonParse` (result leg; MARSHAL micro diet 3.71 ms) | 3 | 4 | 0 | JSON parse 3.14 MB |
| wrapper residual (dispatch, refold, CEntry) | 4 | 3 | — | unattributed, inherent |

Glue rate: (6.15 + 3.14 MB) / 7wt ≈ **1.3 GB/s — the memcpy floor**.
Passes over the bytes: request 4 (stringify-emit + Utf8Length + WriteUtf8V2 +
serde-parse), result 3 (serde-emit + NewFromUtf8 + V8-parse) — MARSHAL's 3+3
structure, flame-split. Publish-bucket `JsonStringify` 9/8wt is publish's own
emission (outside compile fence, not counted as seam). `SlowFlatten`: 0 in
compile (scan 7 = scan's own ropes; publish 2 = MARSHAL rope via crypto::Hash).

Fixed (count-scaling) crossing cost: entry self **0** + glue self **0** +
wrapper-self ~0 across 2×518wt → **≈0 ms at count 1**.

## Marshal-split: harvested vs remains vs diet cost

- HARVESTED (landed set-3): result duplication −2,927,789 B wire (−48.2%);
  parse −2.95 ms micro; napi-out/serde shares. `wire.rs` + slim struct + refold.
- REMAINS (inherent, fenced): request `files[]` = load (omission statically
  rejected, 240 ms re-pay); result dieted sheets + runtime (bytes must cross);
  glue byte-copies at memcpy floor (no mechanism — a JS string cannot enter
  Rust without length+encode materialization; WriteUtf8V2 IS the floor).
- DIET COST (landed, visible): `split_shared_suffix` 2/2wt in-napi + publish
  rope flatten 2wt — MARSHAL's filed ~0.3 + ~0.5 ms, confirmed at flame grain.

## Verdict

**CUT.** The seam is settled with counts, on two axes:

- COUNT axis (crossing-attributable proper): 1 crossing/sync (exact, optimal —
  floor is 1), fixed cost ≈0 ms (zero self on every seam frame ×2 captures).
  **0 ms ≪ 5 ms phase floor.** There is no count room; per-css/per-file rates
  (1/7527, 1/15122) are already minimal.
- VOLUME axis: full codec stack 42/43wt, but every leg is load-inherent and
  MARSHAL-fenced (duplication harvested; omission statically rejected) or a
  memcpy-floor copy with zero self. Largest single frame (V8 request stringify
  11wt) is fenced load bytes, not a mechanism. No unfenced mechanism ≥5 exists;
  per repro3 precedent (fantasy ≤15 with no single mechanism ≥8 → CUT-fast)
  the glue total itself (7/7, max single frame 4) CUTs on its own.

The ~300 ms compile-window gap is NOT seam dark matter: every seam frame is
attributed above (43/42wt), and the gap remainder stays diffuse
malloc/memmove/kernel/node as repro3 filed. Nothing hides here.

## Exact filler + bank conditions (carried, not a crew topic)

FILLER (unshaped protocol surgery — pushstring-interning precedent: stays
filler until someone files a soundness design, not a brief): replace JSON both
legs with a binary protocol (napi Buffer zero-copy views + binary codec), or
structured napi values for `files[]`. Fantasy bounded by the full codec stack
≈40wt at impossible 100% (bytes must still move: ~9 MB ≈ 6 ms floor + binary
encode/decode); realistic unknown, BANK-track at best. Negative guidance filed:
structured values move the count axis 1→15,000+ crossings — each crossing must
cost <0.3 µs to break even; statically disfavored, do not brief without a probe.

BANK CONDITIONS (all required): (1) soundness design filed first (proof channel
+ `contracts/` + sortshape preserved, zero emission-order change, composes with
the landed slim wire — no double-count of the harvested 2.93 MB); (2) count
probe on captured enterprise payloads (6.15 MB req / 3.14 MB res) with a
flame-reproducing method showing ≥5 ms + ≥25% of the dieted codec leg;
(3) beats MARSHAL's static rejection with NEW filed evidence (omission stays
rejected — re-encoding shapes only); (4) full voyage proof on verdict runs
(4-scale byte-identity, determinism, suites, `agentrs q`); (5) solo-LAND claims
(≥15 ms + ≥1.5%) need near-total capture proof — extraordinary, expect BANK.

## Proof of no-disturbance

- `git status` delta vs HEAD after this scout: this REPORT.md (untracked) only;
  `dist/` untouched (no rebuilds); no bench lock touched (lock-free queries);
  no foreign PIDs touched; no `git stash` anywhere.
- Reproduce every number: `pnpm agentrs flame --inspect
  docs/evidence/flamegraph/enterprise-repro4{a,b} '<fn>' --phase <compile|
  publish|all>` with fn ∈ {napi, __napi__compile_system, FromNapiValue,
  ToNapiValue, napi_get_value_string_utf8, napi_create_string_utf8, from_trait,
  reference_virtual_native::atomic::serialize, Json, Builtin_JsonStringify,
  SlowFlatten, Flatten, emit_dts} + the static files cited above.
