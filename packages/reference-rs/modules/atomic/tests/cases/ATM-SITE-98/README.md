# ATM-SITE-98 — A same-file css wrapper around a package tag threads external, so the call-site css backs the package's qualifier

A small wrapper that forwards its `css` prop is the common way to reuse a
component: `const Wrap = ({ css }) => <Button css={css} />`. Here `Button` comes
from `@reference-ui/lib/primitives`, an installed package (`input/node_modules`)
whose runtime mints classes under the systems its published `baseSystem` names, and the call site writes
`<Wrap css={{ color: 'blue' }} />`. The twin `OwnWrap` forwards its `css` into
Reference's own `Div` and is called with `css={{ bg: 'red' }}`.

The `css` threading pre-pass reads the same ownership verdict as the JSX walk,
not the bare name. `Wrap` forwards into a package tag, so its call-site `css`
backs under the package's composed systems: with lib and acme composed
(`upstreamSystems: ['reference-ui', 'acme']`) it plans and paints
`reference-ui__c_blue` only, there is no `@reference-ui/lib__c_blue` class, and no `ATM-W-MISSING-STYLE-PLAN`
names `color` (a wrapper recorded as own pointed that warning the wrong way).
`OwnWrap` forwards into an own host, so its call-site `css` stays own and plans
`@reference-ui/lib__bg_red`; the diagnostics analysis predicts it own too, so
no `ATM-W-MISSING-STYLE-PLAN` names `bg` under the composed upstreams.

The spec compiles twice: the default request (no roster, no upstream; the
goldens, where the `Wrap` call site reports `ATM-W-EXTERNAL-UNBACKED` because
nothing is composed to back it, ATM-SITE-100) and Core's request with the
primitive roster (`jsxHosts: ['Button']`) and both upstreams. Nothing is configured by the user. Siblings: ATM-SITE-96
(direct package import), ATM-SITE-97 (barrel re-export), ATM-SITE-99 (published
wrapper name).

> Search terms: ownership, provenance, css wrapper, css forwarding, wrapper threading, is_css_forward, HostGate, call-site css, external want, package tag, lib primitives, MISSING-STYLE-PLAN, upstreamSystems
