# ATM-SITE-103 — A component tag from a package not built on Reference UI is not a Reference component: its style-named props mint no want, no class and no diagnostic

Owner ruling (plan section 11.2): tags from packages not built on Reference UI
are silent. `App.tsx` renders `<Heart color="red" size={16} />` from
`lucide-react`, installed in the case (`input/node_modules/lucide-react`) with no
published system and no `@reference-ui/react`, and `<Sparkline color="blue"
p="2r" />` from `chart-kit`, which nothing installs. Both prop sets spell style
props, but neither package renders through any Reference runtime: Lucide's
`color` is an SVG stroke, and an unresolvable package proves nothing.

The import is followed to the package directory and that directory is read: no
`exports["./baseSystem"]`, no `.reference-ui/system/baseSystem.mjs`, and no
runtime import that resolves to this compile's own (the unresolved one has no
directory at all). Both are `Foreign`: no want, no style plan, no class and no
diagnostic, in the standalone compile and with lib composed (`upstreamSystems:
['reference-ui']`, Core's primitive roster). Before, a capitalised tag from any
package lowered as external and was backed under every composed system
(`reference-ui__c_red`, `reference-ui__w_16`, ...), classes nothing renders.
Reference's own `<Div p="1r">` is the control that paints. Nothing is
configured by the user.

Siblings: ATM-SITE-100 (a Reference package nothing composes warns),
ATM-SITE-102 (a package borrowing the app's runtime is own), ATM-SITE-96
(a Reference package's own system).

> Search terms: foreign package, not built on Reference UI, lucide-react, third-party component, icon library, silent, no want, no spray, unresolved package, provenance, package directory verdict, Foreign, style-named props, owner ruling
