# CORE-NAMER — runtime and compiler namers agree

Proves the two namers are one algorithm: the runtime namer (`css()` time) constructs exactly the slot and className lists the compiler namer (compile time) wrote into the plans, for every authored declaration the compiler named. The compiler namer is the oracle; the differential gate holds the mirror equal to it. The runtime namer reads the namer tables plus its procedures; it never consults the sheet and never looks up a per-atom row.

The dialect under proof: `css()` over holes, responsive arrays, per-prop objects, `_hover`, `md`, trailing-`!`, and the macros (`font`, `size`, `border`, radius pairs, `flex: '1'`), plus dynamic values with no compiled atom. Reference-rs cases leaned on: ATM-SEAM-06 (no per-atom row in the artifact), ATM-SEAM-07 (artifact bytes independent of atom count), ATM-SEAM-08 (runtime namer reproduces every namer golden), ATM-NAME-08 (class stem passes only through explicit lexical functions).

Decisions taken: a miss constructs its miss class, paints the inherited value, and reports exactly one browser-dev diagnostic naming prop and value — node and production stay silent. The tables and the runtime namer carry the same version integer; `registerRuntimeData` refuses a skewed pair loudly. Not this group: token/rhythm/wrap recomputation in the runtime namer, a node-side miss catalog, GHOST-04 namer injectivity (stays an rs case).

Open: CORE-NAMER-01 (differential over every authored declaration of every engine input, byte-equal lists), CORE-NAMER-02 (browser corpus paints the pre-cutover class lists), CORE-NAMER-03 (miss class present, paints inherited, exactly one browser-dev diagnostic), CORE-NAMER-04 (late inline sheet warns only the true miss). All four rows read `open`: proofs not yet green.

> Search terms: runtime namer, compiler namer, differential gate, miss class, className lists, slot lists, pre-cutover corpus
