# collect — the collection subsystem

Collect finds the author calls in a project, evaluates each file once in
Node, and merges everything into one `EvaluatedSystemSpec` for the
compiler. It is the first leg of every sync: nothing compiles until
collect has produced the spec, and nothing downstream ever re-reads
author source. The name is the job description — this subsystem collects.

```text
include globs
  → scan (TS mirror / native single-read, retention held)
  → bundle (one IIFE per file, bootstrap aliases)
  → prepare (upstream bundles + local IIFEs + retention)
  → evaluate (one Node script, collectors capture)
  → merge (later-wins, _private strip, provenance)
  → EvaluatedSystemSpec
```

The subsystem has two faces. The surface is what fragment files import:
four calls, their shapes, and nothing else. The machinery is everything
behind that: discovery, bundling, preparation, evaluation, merging.
Each face documents its own contract next to itself.

## What collect does NOT own

Collect never lowers styles: no atomic CSS, no class names, no
stylesheet assembly — the compiler emits all of that from the spec.
It never defines the wire format, which belongs to
`reference-rs/contracts`, and it never compiles, publishes, or links.
It never traces JSX — host discovery is the engine's job — and it never
reads `ui.config` itself; configuration arrives already loaded and
validated. Upstream global CSS passes through collect unevaluated on
purpose: the packed-CSS merge owns that stream, and collect's
suppression window is the boundary, not an oversight.
