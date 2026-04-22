# Install Test Fixture

This fixture is the thinnest downstream-style scenario for the future pipeline matrix.

Its job is to prove the minimum install and boot path:

- install the packaged Reference UI modules
- run `ref sync`
- start a dev server
- render one known marker in the browser

It is intentionally small so matrix infrastructure failures stay easy to diagnose.