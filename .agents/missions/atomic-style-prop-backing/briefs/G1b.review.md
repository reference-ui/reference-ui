# G1b — C-T16 landed: confirm the fix + ratify the withheld sub-item

Reply with `STATUS: DONE` (confirmed, W3 unlocked) or `STATUS: REVISE`
(itemized) as your first line. Read-only: no product code.

You ruled **C-T16 option (c)** in `reports/G1.review.md` §4 (foreign groups are
consumer-local; upstream entries contribute own-qualified rules only at
composition; the compiling page keeps its full grouped utilities; engine emission
unchanged except a delimiter). The crew landed it. Confirm it matches the ruling,
and ratify one **withheld** sub-item.

## Landed (from `handoffs/C-T16.md`; verify from the bodies)

- **(c1) engine sentinel** — `cascade/mod.rs`: `write_foreign_group` +
  `push_foreign_marker` bracket each foreign group with `/* foreign <q> */` /
  `/* end foreign <q> */`, emitted **only** on the non-empty-external path; the
  empty-external short-circuit (`return write_utilities(out, own, &qualifiers[0])`)
  is **byte-for-byte unchanged**.
- **(c1) TS strip** — `streams.ts`: `stripForeignSections` (line scan, no selector
  parsing) removes marked sections; `printUpstreamBlock` and `toPublishedEntry`
  strip; **`printOwnInner`/`printOwnBlock` unchanged** (own page keeps its group);
  marker-free input passes through **byte-identical**.
- **(c2) WITHHELD — the deviation to ratify.** `book/**/*` was **not** dropped
  from `packages/reference-lib/ui.config.ts` `include`: dropping it removes
  `reference-ui__fs_3.8r` (minted **only** by `book/app/BookShell.tsx:139`) from
  lib's `.reference-ui/react/styles.css`, which **Book serves** via a vite alias —
  Book does not read lib's `dist`, but it does depend on lib's compiled output
  including `book/**`. So the drop was stopped and reported per your §5 item 3
  guardrail. **c2's stated goal — lib's composed entry carries zero
  `reference-icons__` — is met by c1 alone.** The ratified T09 §3 comment was
  applied verbatim.
- **(c3) re-materialized** (native rebuilt → neo bin → lib `ref sync` →
  `materialize-runtime.mjs`; icons unchanged).
- **(c4) evidence** — T16 **native 6/6** (fresh `ref sync`) + **hermetic 6/6**,
  `matrix/tests/chain/T16` **untouched**; lib published entry `reference-icons__`
  = **0** (icons entry keeps canonical **7**); lib's **own page** keeps its full
  foreign group (609 rules + one sentinel pair) — **fan-out preserved**; unit
  proof that composition strips upstream foreign while keeping own foreign.

## Captain verification (firsthand)
- Fresh `ref sync` in `matrix/tests/chain/T16` → CSS 279.2 KB → page
  `reference-icons__` rules = **7**; `pnpm agent playwright T16` → **6/6 PASS**.

## Byte-identity
- atomic seam **315/315**, no golden drift; neo base **75/75**;
  `stripForeignSections` byte-identical on marker-free input; empty-external
  short-circuit unchanged (no standalone station has foreign, so no golden carries
  a marker).

## Ask
1. Confirm the **sentinel + strip** implementation is the ruled design (not a
   variant), and that **upstream-strip + own-keep** is correct at composition
   (including the portable/dual-sheet path).
2. **Ratify the c2 withholding** (book kept; c1 alone meets the goal) — or require
   the drop together with a Book-serving solution.
3. Confirm **fan-out is preserved** (own-page foreign retention) and that T17's
   accounting must pin **consumer-own foreign** (G1 §4).
4. Confirm **W3 is unlocked** (T08 T17 with the §3 amendments + T09 forwarding
   fixes), or name anything else that must land first.
