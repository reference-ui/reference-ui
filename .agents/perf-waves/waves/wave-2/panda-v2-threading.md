# panda-scout: Does Panda v2 multithread COMPILE?

**Verdict: NO.** Panda v2's compile pipeline is single-threaded end to end:
one-shot `compile()`, stateful `parseFiles()` ingestion, snapshot assembly,
and stylesheet emission are all serial loops on the calling thread. The repo's
own design notes say so explicitly ("Single-threaded for now",
"Parallelism ... not built"). All paths below are
`vendor/panda/...` in workspace `/Users/ryn/Developer/reference-ui`.

## Scan/compile boundary (scan out of scope, noted for orientation)

- `packages/compiler-shared/src/driver.ts:222-244` — `BaseDriver.parseFiles()`:
  `scan()` returns paths (glob via serial `walkdir`, `crates/pandacss_fs/src/os.rs:73`),
  then a single synchronous NAPI call `this.#compiler.parseFiles(paths)`.
  Compile begins at that call.

## Positive evidence of serial compile

1. **Stateful batch ingest is a serial `for` loop.**
   `packages/compiler/crate/src/project/files.rs:258-275` (`Compiler::parse_files`):
   `for path in paths { read_to_string; parse_inner(...); }`.
   One shared `ParseSession` across the batch; results pushed in input order.
2. **One-shot `compile()` is a serial `for` loop.**
   `packages/compiler/crate/src/compile.rs:163-165`:
   `for file in files { project.parse_file(&file.path, &file.content); }`,
   then `static_pattern_atoms` + `build_compile_output` (compile.rs:166-179), all inline.
3. **Sessions are explicitly ordered.**
   `crates/pandacss_project/src/lib.rs:332-341`: `parse_session()` —
   "Start an ordered parse session with one consistent cross-file view."
4. **Every NAPI export is synchronous.** All `#[napi]` fns in
   `packages/compiler/crate/src/*.rs` and `project/*.rs` return values directly;
   zero uses of `AsyncTask`/`Task`/`ThreadsafeFunction`/`spawn_blocking` anywhere
   in the NAPI crate (grep-verified). No background threads behind the JS boundary.
5. **No data-parallelism crates.** No `Cargo.toml` in the workspace declares
   `rayon`/`tokio`/`threadpool`/`crossbeam` (grep-verified). `rayon 1.12` appears
   in `Cargo.lock` ONLY as a transitive dep of `oxc_index` (oxc dep); there are
   zero `par_iter`/`par_bridge`/`std::thread::spawn`/`thread::scope` call sites
   in `crates/` or `packages/compiler/crate/`.
6. **No JS-side workers.** No `worker_threads`/`Worker`/`tinypool`/`piscina`/
   `os.cpus`/`availableParallelism` in any `packages/*/src` (grep-verified).
   Only `Promise.all` in the pipeline is watcher subscribe/unsubscribe setup in
   `packages/cli/src/watch.ts:168,186` (async I/O setup, still one thread).
   `load-binary.ts:1` `execFileSync` = binary arch detection; `cli/.../init.ts:413`
   `execSync` = package install. Neither is compile parallelism.
7. **`Mutex`/`RwLock`/`OnceLock` hits are interior mutability, not threads:**
   resolver export cache (`crates/pandacss_extractor/src/cross_file.rs:368`),
   in-memory FS (`crates/pandacss_fs/src/memory.rs:16`), codegen statics
   (`crates/pandacss_codegen/src/context.rs:152,157`), tracing aggregator.
   Nothing is spawned; all use is same-thread `&self` sharing.

## (a) Where compile spends its shape — the serial bulk (AssembleCtx analog)

- `crates/pandacss_project/src/lib.rs:1655-1735` — `stylesheet_snapshots_inner()`:
  a serial chain of `refresh_*_snapshot()` gathers (atoms, encoded recipes,
  token refs, static recipes, utility styles, view transitions, position-try,
  keyframes), then a single `ProjectStylesheetSnapshots` struct handed to the
  emitter. Direct analog of a whole-project assemble-then-emit phase.
- `lib.rs:1737-1744` — `refresh_atoms_snapshot()`: collects the global
  `atoms_cache` into a Vec and runs one project-wide `atoms.sort_by(compare_atoms_by_emit_order)`.
  Guardrail in `design-notes/compiler-lifecycle.md:109-111`: "`compile()` still
  sorts and emits from the whole project-wide atom set."
- Global incremental registry: `Project.atoms_cache` + `atom_counts` refcounts
  (`design-notes/performance-budget.md:64-71`, "Incremental project atom cache");
  per-file parse inserts into first-seen cache — the shared mutable registry that
  makes naive per-file fan-out incorrect (same role as AssembleCtx).
- Emission: `packages/compiler/crate/src/compile.rs:439-485`
  (`build_stylesheet_output`) → `pandacss_stylesheet::compile(...)` — one serial
  call over the borrowed snapshots; `crates/pandacss_stylesheet/src/*.rs` has
  zero thread/parallel constructs (grep-verified).

## (b) Architecture / migration docs on threading

- No `V2_MIGRATION`-style doc is vendored (only `design-notes/chakra-ui-design-system-migration.md`,
  which is a design-system content migration, unrelated to threading).
- `design-notes/scope-and-boundaries.md:31-36` ("Per-file parallelism"):
  "**Not yet done.** Worth doing eventually via `rayon`, but tied to a deferred
  bulk-file API... Single-threaded for now keeps the encoder's path buffer and
  the resolver caches simple."
- `design-notes/compiler-lifecycle.md:106-108` (Guardrails → Batch ingestion):
  "`parseFiles()` remains ordered so callbacks and per-file replacement keep
  their existing semantics... Parallelism requires a separate pure-analysis
  phase and is not implied by the batch API."
- `design-notes/performance-budget.md:92`: "**Per-file parallelism.** Not built;
  tied to a deferred bulk-file API. The `parse_files(iter)` shape is the natural
  seam when it lands."

## Serial-vs-parallel map (compile portion)

| Phase | Location | Serial / Parallel |
|---|---|---|
| File ingest (batch) | files.rs:266-272 / compile.rs:163-165 | SERIAL for-loop, ordered |
| Per-file parse+extract (oxc) | lib.rs:325-330 → parse_file_inner | SERIAL, one AST per file (perf-budget.md:57) |
| Cross-file fold/resolver | cross_file.rs (Mutex cache) | SERIAL, shared-session |
| Atom registry accumulate | lib.rs atoms_cache + refcounts | SERIAL global registry |
| Snapshot assembly | lib.rs:1655-1735 + sort 1737-1744 | SERIAL chain + project-wide sort |
| Stylesheet emit | compile.rs:439-485 → stylesheet::compile | SERIAL single call |
| Codegen artifacts | pandacss_codegen | SERIAL (OnceLock statics only) |
| JS driver/CLI/plugins | driver.ts, watch.ts, postcss/vite | SERIAL, no workers |

## Open questions

1. None material for the HQ question — the answer is settled by both code and docs.
   Trivia only: oxc's own parser is single-threaded per `Parser::parse` call
   (upstream fact, not re-verified here); `oxc_index`'s rayon dep is dormant
   unless Panda calls a parallel iterator, which it never does (inference from
   zero call sites + no rayon in any Cargo.toml).
