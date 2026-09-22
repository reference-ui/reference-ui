# swarm-atrules REPORT: `extract_at_rules` per-atom Vec diet

## Verdict

**CUT (counted ceiling ~1ms optimistic bars both prongs: the 15ms LAND bar and
the 5ms per-phase floor — survives 3× cost-model error; exact filler + bank
conditions filed below, nothing implemented)**

## Base / artifacts

- Base commit: `3dd32a659715aeb17d5d04167d756fb7f5ce30c8` (verified `git rev-parse HEAD`
  first command; wave-2 set-3 tip)
- Count `.node` #1 sha256: `0ad072ee8b1fde9ea1c5cd7fb091186a813978290306d25dc8182fb4c07de789`
  (17-counter census, fully reverted, never scored)
- Count `.node` #2 sha256: `ce1405f3c62794d5c70109ef3981bee206caf9ec1c1dfff53ef21c69846aa9bc`
  (+g0 empty-wrap-group census, fully reverted, never scored)
- Both binaries `cp`-saved aside (`/tmp/swarm-atrules/count.node`, `count2.node`,
  hashes distinct); arms selected via `REFERENCE_UI_NATIVE_PATH` (zero
  swap/rebuild interference, cascade INTEGRATE method). Override efficacy proven
  by the count runs themselves (SWARM lines appear only under the count binaries).
- Fresh worktree lacked `node_modules`, `dist/*.mjs`, `.node` → `pnpm install` +
  `build:js` ran once each inside the census lock hold (gitignored/byproducts
  restored, not in diff).
- In-tree `reports/latest/*` (tracked, bench-regenerated) reverted after the block.
- Final tree: this REPORT.md only. `git status` clean otherwise, pin OK, the two
  pre-existing stashes (`sim-quarantine-pipeline` + `Agent Playwright CT`)
  untouched throughout. No commits, no pushes.

```
git diff --stat
(empty — instrumentation reverted, bench byproducts reverted, tree clean)
```

## 1. Mechanism (ONE, counted then killed): borrowed-key grouping probe

LEAD from swarm-recipepath §6 (BANKED, pending set-4): `extract_at_rules` still
allocates a `Vec<String>` per recipe atom (9,057×/sync); the at-rule strings vary
per atom so they are NOT hoistable by rule — needs a key-shape diet (e.g.
borrowed-key grouping) with IndexMap insertion order preserved bit-exact.

What the census proved live (seed-7 enterprise, §2): the lead's implied volume
overstates the addressable set by **23×**. Of 9,057 per-atom `Vec<String>`s, 6,629
(73%) are **zero-alloc empty collects** (`collect()` over zero wraps never touches
the heap); of the 2,428 heap Vecs, only **393 are grouping hits** — misses must
still build the owned key the map stores. The dietable set is 393 Vec allocs +
393 String allocs per sync, not 9,057.

Designed diet (NOT implemented — filed as exact filler in §6): replace the
always-allocate-then-`entry()` shape in `group_recipe_atoms` with a borrowed-key
linear probe — selector-first, then element-wise wrap-sequence equality against
the atom's live `at_rule_wraps(atom)` iterator (zero alloc on both paths); hits
push into the existing group, misses fall through to the untouched
`extract_at_rules` + `insert`. Container type, key type, insertion sequence,
value construction, sort comparator, and all downstream fns untouched.

Deliberately unbuilt: the ceiling (§2) bars both prongs, so per the brief and
the sortshape/lowermemo/resolvefmt precedents this CUTs before the timed bench —
no candidate was built, no timed pairs were run, no lock time was spent on a
verdict that cannot change.

## 2. Mechanism counts (seed-7 enterprise load)

Temporary `AtomicUsize` census (1 file, `emitter/mod.rs` only — `escape.rs`
untouched per fence; env-gated `eprintln` dump, `stderr` inherited through the
bench child so `stdout` JSON stays pure). Fully reverted after the block
(`git status` clean). Four runs total: ×2 byte-identical on binary #1 (10,485
SWARM lines each), ×2 byte-identical on binary #2 (g0 follow-up); all shared
counters consistent across all four runs.

```
SWARM-SUMMARY emission=0 rules=1427 atoms=9057 w0=6629 w1=2428 w2=0 w3p=0
  wmax=1 wsum=2428 wbytes=70896 cap0=6629 cap4=2428 cap8p=0
  groups=4394 gmax=13 g1=1908 gm=2486 g0=2359
```

| count | value |
| --- | --- |
| `group_recipe_atoms` calls (rules) | **1,427** (= recipepath ✓) |
| `extract_at_rules` calls (recipe atoms) | **9,057** (= recipepath ✓) |
| wraps/atom: 0 / 1 / 2 / 3+ | **6,629 / 2,428 / 0 / 0** (wmax 1) |
| wrap bytes total / mean | 70,896 / **29.2 B** |
| vec capacity 0 / ≤4 / >4 | **6,629 / 2,428 / 0** (every heap Vec is exactly cap 4) |
| distinct wrap queries on load | **3** (`@container (min-width: 640px)` ×951, `768px` ×993, `1024px` ×484) |
| distinct wrap sequences | 4 (empty ×6,629 + the 3 singletons — every wrapped atom carries exactly one wrap) |
| total groups / rules | **4,394** (= recipepath's 4,394 emitted recipe selectors ✓) |
| groups per rule max / shape | **13**; 1–5 groups covers 1,271/1,427 rules (89%) |
| singleton / multi-decl groups | 1,908 / 2,486 |
| empty-wrap groups (g0) / wrapped groups | **2,359** / 2,035 |
| grouping hits (atoms − groups) | **4,663** = 4,270 w0-hits + **393 w1-hits** |
| `append_recipes_layer` emissions per run | 1 (`emission=0` single summary line every run) |

Derived dietable set: only w1-hits avoid work under borrowed-key grouping (w0
atoms allocate nothing today; misses still build the owned key). **393 Vec
allocs (cap 4, 96 B each) + 393 String allocs (~29 B each) = 786 heap allocs
per sync.**

Ceiling math: recipepath's landed-pending diet (same allocator, same machine
class, same load) measures −13.05 ms for 10,484 eliminated allocs ⇒ ~1.24
µs/alloc implied rate, second-order effects included. 786 × 1.24 µs ≈ **0.97
ms optimistic**. Generous fantasy (2× superlinear allocator relief): ~2 ms.
3× cost-model error: ~3 ms — still below the **5 ms per-phase floor**, and an
order of magnitude below the **15 ms LAND bar**. The ceiling bars both prongs;
lowermemo (4.3/1.2), resolvefmt (2.9/0.5–1), and canonjson (~6/~3) all CUT at
higher ceilings.

A richer variant was examined and is also barred: borrowed `Vec<&str>` map keys
would additionally diet the miss-path Strings (393 vecs + 2,428 strings ≈ 2,821
allocs ≈ 3.5 ms optimistic) but stays below the 5 ms floor while demanding an
invasive `RecipeGroup` lifetime refactor across the sort and write path — more
order-bar risk for a still-sub-floor prize. Filed so no future wave retries it blind.

Probe-cost caveat (for the filler): 6,629 w0 atoms allocate nothing today, so any
probe change must be ~neutral there. The filed linear probe trades one Fx hash +
table lookup for ~2–3 selector-first memcmps per atom (GMAX 13, typical G ≤ 5);
the Equivalent-probe alternative (§6 note) keeps the hash and is neutral by
construction. Neither moves the ceiling — the alloc volume is the whole prize.

## 3. Correctness

- (a) `pnpm agentrs c atomic` on the final (reverted, base-identical) tree:
  **594 + 1 passed, 0 failed** — exactly the set-3 tip count (recipepath's 596+1
  on this base is +2 pins). `pnpm agentrs q`: nothing to check — zero touched
  files in the final tree. Release build emitted the same 18 pre-existing
  warnings as set-3 (none on census lines).
- (b) Byte-identity: no code change, so no 4-scale proof is owed. Side evidence
  all four instrumented runs were output-clean: every kept enterprise output
  hashes to the sealed wave-1 pins character-for-character
  (`styles.css 7ec827fb…e10dcea`, 2,867,925 B; `runtime-data.mjs
  718d19e4…378918`, 214,466 B — full 64-char strings verified, ×4 runs).
- (c) Determinism: the census replicates recipepath's filed counts EXACTLY
  (rules 1,427, atoms 9,057, groups 4,394) across independent builds/runs, and
  both binaries reproduce themselves byte-identically (10,485/10,485 lines) —
  the count path is deterministic.

## 4. Enterprise A/B

None — CUT before the timed bench per the brief ("the counted ceiling bars both
prongs → CUT fast without touching the bench"; sortshape precedent). No pair
table, no medians; the instrumented count runs' syncMs (~1.1–1.5 s, cold +
counting overhead) are not verdict numbers.

## 5. Caveats (honest)

- The ~1 ms ceiling scales linearly from recipepath's −13.05 ms / 10,484 allocs.
  The split between scan savings and allocator relief in THAT number is itself
  unproven (their §5) — but every plausible split keeps my 786-alloc prize at
  ~1–3 ms, and the floor is 5 ms. The verdict does not depend on the split.
- The linear-probe filler is unmeasured; on w0-heavy loads it could plausibly be
  wall-neutral or slightly wall-negative (extra memcmps vs one hash). It must
  never BANK alone — only inside a sum, with its own byte-identity proof (§6
  bank conditions).
- One lock hold: census block (install + build:js + 2 count builds + 4 count
  runs + pin hashes), released in two steps immediately after. No
  foreign-process interaction of any kind.

## 6. Collision + FILLER (for the captain)

- TEXTUAL (had it been built): diet would touch `stylesheet/emitter/mod.rs` only
  (loop probe lines + 2 small fns under `extract_at_rules`, +2 tests in
  `emitter_ordering_tests.rs`). ADJACENT to recipepath's PENDING set-4 hunk (same
  loop: its `recipe_selector(...)` call line sits between the probe lines) —
  semantically independent (selector string vs at-rules key), sequence in either
  order, but the set-4 integrator should expect a mechanical merge, not a clean
  double-apply. NO overlap with sysprefix pending (`name/`, `cascade/`),
  cloneplasma landed (`resolve/`, `builder/`, `extract/`), marshal seam, or
  realloc/collect ground.
- BEHAVIORAL (filler design): output bytes identical by construction — same map,
  same keys, same first-occurrence insertion order, same per-group declaration
  Vecs, untouched sort/write pipeline. Order-preservation argument: (1) the
  linear probe returns Some iff an equal key already exists, using the same
  pairwise `(wraps, selector)` equality the map itself uses (selector compared
  first is a pure predicate reorder — same boolean); so miss/insert positions
  are exactly the `entry().or_default()` positions; (2) `vec![declaration]` on
  miss + push-on-hit builds the same declaration Vecs as or_default+push; (3)
  everything downstream of grouping (`into_iter`, `sort_by`, `group_bucket`,
  wrap classifiers, `write_recipe_block`) is byte-untouched, so identical
  groups ⇒ identical bytes. A future implementor must still re-prove 4-scale
  byte-identity + determinism on the then-tip — the argument shapes the proof,
  it is not the proof.
- BANK CONDITIONS (revival bar): (1) implement exactly the filler below (or the
  Equivalent-probe note) on the then-tip; (2) full BANK proof mandatory (8-pair,
  4-scale byte-identity vs sealed pins, determinism, atomic suite, `q` 0
  violations) — the order bar in §6 must be argued explicitly with the
  insertion-sequence evidence; (3) bank ONLY inside a sum whose other members
  clear noise — alone this is unresolvable (±10 ms pair noise vs ~1 ms);
  (4) re-census GMAX on any new load (correctness holds for any GMAX; probe-cost
  reasoning assumes small groups).

### Exact filler (applies to base `3dd32a65`; composes under recipepath's pending hunk)

In `group_recipe_atoms`, replace the loop body:

```rust
for atom in &rule.atoms {
    let selector = recipe_selector(&rule.class_name, atom);
    let declaration = format_declaration(atom);
    match find_recipe_group(&groups, atom, &selector) {
        // Hit: reuse the existing group. Zero at-rule allocs.
        Some(index) => {
            if let Some((_, declarations)) = groups.get_index_mut(index) {
                declarations.push(declaration);
            }
        }
        // Miss: pay the owned key once per DISTINCT group (first occurrence).
        None => {
            groups.insert((extract_at_rules(atom), selector), vec![declaration]);
        }
    }
}
```

New helpers under `extract_at_rules` (`extract_at_rules` itself untouched —
it becomes the miss-path allocator):

```rust
/// Borrowed-key probe: locates the existing group for this atom's wraps plus
/// `selector` without allocating the per-atom `Vec<String>`. Linear over the
/// rule's groups (census GMAX 13, typical <= 5); insertion order is
/// first-occurrence, exactly the `entry().or_default()` shape it replaces.
fn find_recipe_group(
    groups: &FxIndexMap<(Vec<String>, String), Vec<String>>,
    atom: &Atom,
    selector: &str,
) -> Option<usize> {
    groups.iter().position(|((wraps, group_selector), _)| {
        group_selector.as_str() == selector && wraps_match(wraps, atom)
    })
}

/// True when `stored` equals this atom's live wrap sequence, element-wise.
/// Re-walks the atom's conditions per candidate; conditions are few, groups
/// are few (census), and no allocation happens on either path.
fn wraps_match(stored: &[String], atom: &Atom) -> bool {
    let mut live = at_rule_wraps(atom);
    for wrap in stored {
        match live.next() {
            Some(query) if query == wrap.as_str() => {}
            _ => return false,
        }
    }
    live.next().is_none()
}
```

NOTE (alternative, not the filler): an `indexmap::Equivalent`-based probe
(`get_index_of` with a borrowed `(&[&str], &str)` key) keeps the Fx hash and is
probe-neutral by construction, at the cost of a hash-compat proof obligation
(slice length-prefix + element hashes must match `(Vec<String>, String)` tuple
hashing exactly). Prefer it over the linear filler only if a future sum measures
the linear probe wall-negative on w0-heavy loads.

Tests to add (`emitter_ordering_tests.rs`): (1) multi-wrap grouping pin — rule
with 0/1/2-wrap atoms sharing `(wraps, selector)` pairs asserts merged
declarations + block order; (2) wrap-order sensitivity pin — same wraps in
different order must NOT merge (sequence equality, not set equality).

If recipepath's pending patch lands first, the filler's `recipe_selector(...)`
call line becomes `recipe_selector_from_base(&base_selector, atom)` and the
rest applies unchanged.

## Verdict

**CUT (exact at-rules census ×4: 9,057 atoms = 6,629 zero-alloc w0 + 2,428 w1
over 3 container queries, 4,394 groups, 393 dietable w1-hits = 786 allocs/sync
≈ 1 ms optimistic — bars the 5 ms floor and 15 ms LAND bar with 3× margin;
outputs 4/4 at sealed pins; reverted tree 594+1 green; exact filler + bank
conditions filed; no timed bench per CUT-fast protocol)**
