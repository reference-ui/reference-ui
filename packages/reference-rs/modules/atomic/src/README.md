# Atomic native sources

The stylesheet compiler, from author calls to layered CSS plus runtime plans. Extraction turns calls into wants, resolve turns wants into atoms, assembly emits the sheet and the artifact. `lib.rs` orchestrates extraction, condition resolution, class naming, and assembly over virtual and disk sources, exposing the pipeline that build tooling and the Node-API seam consume.

Extraction walks author files into wants; resolve turns wants into atoms against the base system and canon; recipes close variant matrices into scoped rules; the stylesheet stage prints the six-layer sheet; the runtime stage emits plans, slots, and namer tables; diagnostics renders typed failures; scan and sources feed files in one read each; goldens pins the namer mirror.
