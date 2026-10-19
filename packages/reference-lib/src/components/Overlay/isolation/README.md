# isolation

Modal side effects, reference-counted per document. Sibling subtrees go
`inert` (skipping authored hidden ancestors, dropping duplicate ownership
on reparent, walking open ShadowRoots), document scroll locks with RTL
gutter and pinch-zoom allowance (iOS edge sheets pin `body` fixed), and
`body` pointer events disable while a modal layer is present.
