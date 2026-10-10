# destination

Where the children land, decided as pure math. This module maps every
accepted `container` form onto a concrete node or null: omitted and
explicit-null mean `document.body`, refs unwrap to whatever they hold
right now, resolvers are called, and direct nodes are trusted by their
own `nodeType` so a same-origin iframe element survives the crossing
between realms. It also derives the owner document of a resolved node,
because the scope reset downstream needs to publish it. No React, no
effects, no mount — the hook in `hooks/` decides *when* to ask, this
module decides *what the answer is*, and the colocated suite proves each
form in isolation.
