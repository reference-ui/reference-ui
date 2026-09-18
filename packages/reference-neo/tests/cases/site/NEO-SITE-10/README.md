# NEO-SITE-10 — `css={{}}` on a primitive equals `css()`

The world renders `<Div css={{ mt: '8px' }} />` beside a plain node carrying
`css({ mt: '8px' })`. The spec checks both nodes carry that shared class, the
sheet carries the single utility once, and both paint 8px.

Evidence: `[atm]` ATM-SITE-14.

> Search terms: jsx styling, parity, deduplication, site/css-prop, NEO-SITE-11
