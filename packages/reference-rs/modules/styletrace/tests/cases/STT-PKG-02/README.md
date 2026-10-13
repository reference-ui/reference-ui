# STT-PKG-02 — A multi-file plain-React library with no Reference imports stays off the style-bearing surface, barrel re-exports included

Keeps a plain-React component library out of the style-bearing surface.
Converted from fixtures/demo-ui: Button, Card, Badge, and Stack import only
react and never touch Reference primitives or StyleProps, so the barrel and
every component file stay off the surface.
Sibling: `STT-NEG-01` (one component rendering a primitive with no style boundary).
