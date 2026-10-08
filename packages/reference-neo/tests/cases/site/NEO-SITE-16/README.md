# NEO-SITE-16 — Member tags (`<NS.Panel />`) extract under concatenated hosts

The world renders one namespaced panel whose dotted tag matches the
configured `NSPanel` host, plus an unhosted twin namespace. The spec checks
the sheet carries exactly the member's two utilities, the member paints both
props, and the twin renders unstyled — the Panda discovery spelling core
emits for `<Overlay.Content />` and friends.

Evidence: `[atm]` ATM-SITE-22; `[lib]` `Menu.tsx` `<Overlay.Content
minW="40r">`, `Showcase.book.tsx` modal (RS-36).

> Search terms: namespaced component, compound component, dot-notation, site/member-tags, NEO-SITE-11
