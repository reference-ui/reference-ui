# MEMO scanverify: independent forensic verification of the F1 design — VERIFIED

Independent re-run of all four F1 rigs from `/tmp/scan-f1` sources against
DESIGN.md §§6.1–6.5 (24,617B, worktree root of terminal crew scan-F1-design).
The design crew's result text is STRUCK (false prior-art read-claims, see LOG);
this memo verifies only the artifact + rigs. Verdict: **VERIFIED**.

## Identity

- Verifier: swarm-scanverify (shared worktree, read-only mission).
- Spec: DESIGN.md md5 `2674e444e1b7256061a14eab2d822923` (24,617B).
- Lock discipline: 8 holds, 16 claims lines, 0 unlocked timed runs, 0 discards.
- Full evidence: `/tmp/scan-verify-evidence.md` (5,423B; ephemeral — numbers
  below are the permanent record).

## Per-leg claimed vs fresh-observed

- M4 corpus census: PASS, every number EXACT (dead 1669350, style 1770077,
  recipe 905428, counts 12000/3000/120, needle union 3, css 3120, font 1439,
  max 13817, 0 ≥64KB, 0 exact-64K, trio 14113, total 4358968).
- M1 syscall census: PASS, all four shapes IDENTICAL incl. fresh shim +
  fresh builds (node 2426, rts 2395+1198 fstat, big 1202, fsp 1197 pread;
  bytes 818900 each). 4/4 Rust bins byte-identical on rebuild.
- M1e lossy parity: PASS 9/9 IDENTICAL code-point sequences both sides.
- M2 stringify: PASS — bytes 10/10 EXACT (6149286/1364373/15215); every
  median attained in-tol ≥1x (P_full best 6.817 +2.5%, P_paths 1.590 +3.9%,
  P_scan 0.011); deletion floor holds 10/10 runs (≥5.19 vs claimed 5.12).
  Typical P_full 8.6–10.2 (claimed 6.65 at fast edge — see finding 1).
  Steady-state 30-iter: 6.97/1.61; design inside the distribution.
- M3 readwall: PASS — node 200.0 in claimed range, big +2.4%, rts +1.3%,
  bytes 4358968×3 EXACT, big-beats-node 5/5.
- §1 ids: 7/7 resolve (COLLECT wording nuance: BANK-in-tree-via-set-3 vs
  design's "LAND (set-3)" — constraint unaffected). Zero wave3 strings.

## Findings (non-blocking)

1. M2 rig under-warms: 2 warmups insufficient; scored iters 1–3 are
   structurally slow-start, steady-state med 6.97 after. Implementers must
   use ≥5 warmups/longer sampling. All deviations conservative (true
   deletion larger than claimed).
2. DESIGN.md line 372 holds literal `...[truncated 668 chars]` + a
   duplicated `Entry (completed):` paragraph (TAILFIX residue). Cosmetic.

## Captain's adjudication

VERIFIED accepted: M4/M1/M1e exact, M3 in-tol, M2's prize leg (deletion
≥5.19) reproduces robustly with the warming caveat attached as an
implementer obligation. Phantom-contamination confined to brief+result
prose (zero artifact presence, re-confirmed). Design is now eligible for
the HQ accept/decline on the Formula-1 merger.
