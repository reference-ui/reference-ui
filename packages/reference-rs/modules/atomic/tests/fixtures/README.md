# Atomic test fixtures

`lib-system-spec` is the frozen `@reference-ui/lib` design system
expressed as an `EvaluatedSystemSpec`, the same shape typegen consumes. Cases
without their own base-system fixture compile against it via
the harness helpers, which keep the suite's proven lib-token assertions
meaningful while the production seam takes an explicit spec.

The file is generated from base-system's `lib` fixture plus the exact envelope
`lib_fixture::build` constructs (`:root` global fragment, empty recipes and
staticCss, omitted breakpoints/conditions so profile defaults apply). It is a
frozen copy by design: if the lib source ever changes, case goldens stay put
and the drift is a conscious re-freeze, not silent suite motion.

Up: atomic.
