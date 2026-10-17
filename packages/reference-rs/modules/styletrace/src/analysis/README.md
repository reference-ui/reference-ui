# Analysis

The analysis layer scans a directory of source files and returns exported JSX
component names that keep a style-prop link back to Reference primitives.

It builds on the resolver’s concrete style-prop surface, parses components with
Oxc, collects forwarding edges, and then walks the wrapper graph.

## Layout

Parsing turns each source file into component, factory and export records, with
its imports and wrapper props. Prop bindings and the style-signal pipeline are
derived from the parsed body, and pipeline walking is split by node family.

Walking collects the forwarding edges inside a component body, one family of
statements, expressions and JSX at a time. The analyzer then settles each node's
verdict through a memo cache, following edges and compound-member aliases across
modules. Exposure and surface helpers turn those verdicts into the public names,
and the report and source-file helpers serve the entry points.
