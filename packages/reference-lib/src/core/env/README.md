# Dev gate

The one development check for dev-only diagnostics.

It reads the `NODE_ENV` literal every consumer bundler rewrites statically, so production bundles go quiet while unbundled pages count as development without throwing. The colocated test proves each side through real production and development bundles.
