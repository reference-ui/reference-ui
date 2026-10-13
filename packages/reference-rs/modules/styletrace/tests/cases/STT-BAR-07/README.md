# STT-BAR-07 — A wrapper exported under an alias is traced under the exported alias name, not its local binding

Traces a wrapper that is exported under an alias rather than its local binding.
SurfaceInner wraps Div; the public name is Panel.
The traced surface uses the exported alias.
