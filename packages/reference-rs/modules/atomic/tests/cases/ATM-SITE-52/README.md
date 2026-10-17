# ATM-SITE-52 — Shadow Decisions Stay Fail-Closed and Silent

Probes : a JSX tag shadowed by a param (`function F(Div)`) and
an `undefined` shadowed by a param (`function G(undefined)`) both stay
fail-closed — zero wants, zero diagnostics — beside unshadowed controls.
