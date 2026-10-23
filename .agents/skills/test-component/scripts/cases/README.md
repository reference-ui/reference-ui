# Component case catalog

Declarations resolved before any test runs. Builds the catalog from per-ID CT case folders (`<Component>/__e2e__/<ID>/`, AGENTS.md section 7) and from every unit test file, reads unit and component-test declarations without executing their modules, counts static parameter rows through lexical bindings, maps invocations to whole declarations with expected evidence, builds isolated selectors and artifact paths, and checks execution reports against the catalog — so a passing exit without complete evidence still fails.
