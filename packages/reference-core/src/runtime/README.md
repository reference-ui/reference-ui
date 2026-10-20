# Style runtime root

The public surface of the browser style runtime. It re-exports the authored `css()` and `recipe()` resolvers over natively compiled plans plus plan registration and the unbound styled type graph, and it owns the one production gate that quiets dev-only miss warnings under consumer bundlers. Worlds import the generated bundle while specs import this source entry under one stable specifier.
