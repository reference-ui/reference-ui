# ATM-SITE-100 — Style props on a package tag with no composed system to back them warn once per tag, naming the package and the fix

A package built on Reference UI renders through its own bundled runtime, which
mints classes under the package's system name. The consumer's sheet backs those
classes only for systems it composes with `extends` or `layers`; when none of the
package's systems is composed, its wants back under no system and nothing
paints (plan gap 2).

`App` imports `Button` from `@reference-ui/lib` and `AcmeCard` from
`acme-ui`, both installed in the case with their systems
published (`reference-ui`, streaming icons too, and `acme`), with no upstream
system composed. `<Button color="blue" p="2r" />` and
`<AcmeCard bg="red" />` each get one `ATM-W-EXTERNAL-UNBACKED` warning, located
at the tag (file and line), on the default channel (present on the slim
`logs: []` request, no `compiler` channel needed). Two style props on one tag
still make one warning. Each message names the package and the system it renders
through, and its help says to add `<package>/baseSystem` to `extends` or
`layers`. `<AcmeCard title="Plain" />` carries no style props and stays silent.

Composing lib only (`upstreamSystems: ['reference-ui']`, gap 2) backs lib's tag
(`reference-ui__c_blue`, `reference-ui__p_2r`) and keeps acme's warning: acme's
`bg` backs under no system, never under lib's. Composing acme too backs it as
`acme__bg_red`, and no `ATM-W-EXTERNAL-UNBACKED` remains. Nothing is configured by the user.
Siblings: ATM-SITE-96 (package primitive name), ATM-SITE-99 (published wrapper
name), CORE-CHAIN-08 (a prebuilt package's tag backed under its published system).

> Search terms: EXTERNAL-UNBACKED, unbacked external, package tag, composed system, extends, layers, baseSystem, no spray, silent failure, nothing paints, upstreamSystems, located warning, gap 2, partly composed, backing
