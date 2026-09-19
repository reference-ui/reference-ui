# ATM-SITE-41: Barrel Re-Export Probe (Merge Era)

Probes SPEC-V2-56: same-name chains through one, two, and three barrel
hops resolve to the origin const because the barrels are inert to the
project-wide merge and the origin file is in the include set. The
aliased re-export (`export { gap as space }`) warns and drops in the
merge era — the Ph4 build (SPEC-V2-76 binding walk) resolves it.
