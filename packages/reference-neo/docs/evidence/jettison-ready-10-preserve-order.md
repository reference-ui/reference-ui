# Jettison READY ask 10 — `preserve_order`

Crew NUMSEAM, read-only. Claim under challenge: brief §9 divergence table —
"`serde_json::Map` iteration in `resolve_object` agrees [with
`Object.entries`] today only because `base-system/Cargo.toml` enables
`serde_json/preserve_order` and cargo unifies features."

## Verdict: confirmed, with one gap — no test pins the order today

The mechanism claim is exactly right, and the fix (pin `preserve_order` in
`atomic/Cargo.toml`) is behavior-preserving by construction. The gap: **no
existing golden would catch a regression** — every multi-key per-prop fixture
is already alphabetical, and no unit test asserts iteration order. The Slice 1
"Rust test on author order" is not optional hardening; it is the only thing
standing between this footnote and a silent reorder.

## Evidence 1 — `base-system` is the sole enabler

- `grep preserve_order` over all of `packages/reference-rs --include=Cargo.toml`
  returns exactly one hit: `modules/base-system/Cargo.toml:12`
  (`serde_json = { workspace = true, features = ["preserve_order"] }`).
  Workspace root pins `serde_json = "1.0.149"` with no features; `atomic`
  declares it bare.
- `cargo tree -e features -i serde_json` (read-only) shows the sole edge:
  `serde_json feature "preserve_order"` ← `base_system v0.1.0`, via
  `serde_json feature "indexmap"`. No other path enables it.
- Unification always applies here: workspace uses `resolver = "2"`,
  `edition = "2021"`, and `atomic` depends on `base_system` unconditionally
  (normal dependency, not dev/build) — resolver v2 still unifies normal-dep
  features across the graph. Every build containing `atomic` (tests,
  N-API, bins) compiles one `serde_json` with `preserve_order`. There is no
  build of `atomic` without `base_system`, so no configuration observes the
  un-preserved `Map`.

## Evidence 2 — without the flag, `Map` is `BTreeMap` (sorted)

Vendored `serde_json-1.0.149/src/map.rs` (pinned in `Cargo.lock`): module docs
"By default the map is backed by a `BTreeMap`. Enable the `preserve_order`
feature … to use `IndexMap` instead", with
`type MapImpl<K,V> = BTreeMap<K,V>` / `IndexMap<K,V>` behind the cfg. Dropping
the flag flips every `Map` iteration in the process from insertion order to
byte-sorted order.

## Evidence 3 — the order-sensitive site is `resolve_object` alone

- `runtime/builder.rs:280-325`: `for (key, elem) in map` pushes one
  declaration group per key in **iteration order** — output order, not just
  lookup, is order-dependent. `width: { md, base }` today emits `md` first;
  under `BTreeMap` it would silently emit `base` first.
- Neighbors are order-free: `$token`/`$r` shapes use `.get()` (order-free);
  dedupe keys go through `runtime/serializer.rs::canonical_json_value`,
  which re-sorts into a `BTreeMap` before hashing — identical with or without
  the flag. Neo agrees structurally: `css.ts` iterates per-prop objects via
  insertion-ordered `Object.entries`, while `plans.ts:28` sorts keys for
  lookup, mirroring the serializer. So the flag governs exactly one thing:
  declaration output order for multi-key per-prop objects.

## Evidence 4 — pinning it in `atomic/Cargo.toml` changes zero goldens, by analysis

Adding `features = ["preserve_order"]` to `atomic`'s `serde_json` dependency
changes the feature *graph declaration* but not the *resolved feature set*:
`preserve_order` is already enabled in every build that can contain `atomic`
(Evidence 1). Same resolved features → same `--cfg feature="preserve_order"`
→ same monomorphized `MapImpl` → byte-identical behavior in `resolve_object`
and everywhere else. No trial build was run, and none is needed: a `/tmp`
crate copy would resolve the identical feature set and prove nothing further.
(The pin's value is robustness, not behavior: it decouples `atomic`'s
correctness from a transitive feature it never declared — e.g. if
`base-system` ever dropped the flag or `atomic` were consumed without it.)

## Gap — nothing pins author order (recommendation, not blocker)

- `runtime/tests.rs` (215 lines) has no order/iteration test; `builder.rs`
  has no `#[cfg(test)]` module.
- Sweep of all `modules/atomic/tests/cases/*/input/` per-prop objects with
  2+ keys: `{ base, md }` (×several spellings) and `{ base, wat }` — **all
  already alphabetical**, so `BTreeMap` order ≡ insertion order on every
  fixture. A reverse-alpha fixture (`width: { md: '2r', base: '1r' }`)
  asserting `md`-first declarations is the missing pin; per the brief it
  belongs to Slice 1 (`atomic/Cargo.toml` pin + `resolve_object` author-order
  test + R13 "per-prop object key order" row). Until it lands, this ask's
  claim rests on mechanism analysis alone — which is conclusive, but
  unguarded.
