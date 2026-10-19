# CORE-SITE-16 — Member tags (`<NS.Panel />`) extract under concatenated hosts

The world renders one namespaced panel whose dotted tag matches the
configured `NSPanel` host, plus an unhosted twin namespace. The spec checks
the sheet carries the member's two utilities and the member paints both
props — the Panda discovery spelling core emits for `<Overlay.Content />` and
friends. The twin is no host, but `Other.Panel` is project code nobody
traces, so its `bg` lowers under own (styling plan S3) and, being `Div`
underneath, it paints its backdrop too.

Evidence: ATM-SITE-22; reference-lib `Menu.tsx` `<Overlay.Content
minW="40r">`, `Showcase.book.tsx` modal (RS-36).

> Search terms: namespaced component, compound component, dot-notation, site/member-tags, CORE-SITE-11
