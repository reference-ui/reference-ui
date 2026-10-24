# Test-component runner scripts

The component verification runner. Executes unit plus component tests with video evidence, builds contact sheets from the recordings of failed tests (every recording with `--all-sheets`) in the browser, and resolves the case catalog (per-ID CT case folders, discovered unit declarations, selectors, expected rows) that execution reports must satisfy.

One daemon serves every checkout, and each job runs in its own tree: the caller's runner, specs, stories, CSS, Vite gallery and artifacts.
