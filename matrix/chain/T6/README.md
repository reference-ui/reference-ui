# matrix/chain/T6 — Chain (transitive extend)

**Topology:** `Library A ──▶ extend ──▶ Library B ──▶ extend ──▶ User space`

The app depends only on the outer published package
(`@fixtures/meta-extend-library`). That package already extends
`@fixtures/extend-library` and republishes its fragment. So the app's Panda
config sees BOTH layers of tokens, even though the app never imports A
directly.
