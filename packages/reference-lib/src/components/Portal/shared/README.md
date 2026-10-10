# shared

The shape knowledge every other Portal module agrees on. Resolution and
lifecycle both need to recognize the `{ current }` ref-object form of a
destination, and a duplicated inline guard would drift the day someone
teaches one call site a new shape — so the guard lives here, imported by
both, proven by its own colocated test. Anything else that ever becomes
nameless and shared (ids, event helpers, diagnostics) joins it; anything
with a domain name gets its own folder instead.
