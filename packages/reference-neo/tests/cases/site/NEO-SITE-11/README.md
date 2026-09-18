# NEO-SITE-11 — configured `jsxElements: ['Chart']` makes `<Chart p="1r">` a host

The world lists `Chart` in `jsxElements` and renders `<Chart p="1r">`,
with the local Chart forwarding its props through `Div`. The spec checks
the config artifact carries Chart, the sheet carries the single `p_1r`
utility only the Chart site could mint, and the node paints 4px.

Evidence: `[decision D12]`; `[atm]` ATM-SITE-08.

> Search terms: custom element, allowlist, registered tag, user component, site/jsx-hosts, NEO-SITE-12
