# STT-WRAP-01 — A local component that exposes StyleProps and forwards them to a Reference primitive is traced, in body-destructured and fallback forms too

Traces a local component that wraps a Reference primitive and re-exports public StyleProps.
Plain children without style props stay off the surface.
Expected style-bearing exports: BodyCard (body-destructured twin), Card, and FallbackCard (fallback twin).
