# ATM-SITE-104 — A tag from a package whose published streams name two systems backs one rule under each composed stream system, and nothing under any other composed system

`@reference-ui/lib` re-exports icons, so a `BoltIcon` imported from it renders
through icons' runtime while lib's own components render through lib's. The
installed package (`input/node_modules/@reference-ui/lib`) publishes its system
through `exports["./baseSystem"]`: name `reference-ui`, streams
`[reference-icons, reference-ui]`, the shape lib's real sheet carries. The
engine reads the streams, not the d.ts re-export hop, so a tag from lib backs
under every stream system it can render through: two rules instead of one is the
price of not parsing lib's declarations.

`App.tsx` writes `<BoltIcon color="red" />` beside an own `<Div p="1r">`.
Composed with icons, lib and an unrelated `acme` (`upstreamSystems:
['reference-icons', 'reference-ui', 'acme']`), `color` backs under
`reference-icons+reference-ui`: one plan and one painted rule each,
`reference-icons__c_red` and `reference-ui__c_red`, in their own
`/* foreign <system> */` groups, and no `acme__c_red`, because acme renders
nothing here. Before, the want was sprayed under every composed system. With
icons not composed (`['reference-ui', 'acme']`) it backs under `reference-ui`
only: the package's streams meet what this compile composes. The default
compile composes nothing, so the tag backs nowhere and warns once
(`ATM-W-EXTERNAL-UNBACKED`, naming `@reference-ui/lib` and `reference-ui`).
Nothing is configured by the user.

Siblings: ATM-SITE-100 (unbacked warning), ATM-SITE-96 (a single-system
package), CORE-CHAIN-08 (a prebuilt package's tag backed under its published system), matrix T17 contract 7
(icons accounting).

> Search terms: streams, two systems, lib re-exports icons, BoltIcon, reference-icons, published system, baseSystem, exports, foreign group, no spray, composed systems, intersection, backing
