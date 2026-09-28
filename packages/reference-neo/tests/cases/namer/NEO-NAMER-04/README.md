# NEO-NAMER-04 — a late inline sheet warns only the true miss, never the present rule

The world delivers its compiled sheet the Vite-dev way: no `<link>` tag,
just an inline `<style>` injected by a module script that runs AFTER the
app module already called `css()`. The spec checks the live probe carries
its class and paints ember, the dynamic-shade miss probe carries its miss
class on inherited ink, and the page reports exactly one browser-dev
diagnostic naming the miss — none naming the present rule. Ordering
evidence recorded at the first `css()` call proves no sheet existed yet
and the document was still loading, so the unfixed early probe would have
cried wolf here; the injected style's text is byte-equal to the fresh sync
output, so the late rule is genuinely compiled, never a fixture fiction.

Evidence: H-6 (`docs/evidence/atomic-claims.md` §6 miss shape via
`NEO-NAMER-03`); the deferral is the neo side of the probe race.

> Search terms: miss probe race, false positive warning, late stylesheet, inline style injection, vite dev ordering, load deferral, sheetsComplete, reportMissCandidates, settled document, ordering evidence
