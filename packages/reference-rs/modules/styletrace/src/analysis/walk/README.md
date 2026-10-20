# Forwarding-edge walk

AST traversal collecting the edges the analyzer follows. Expressions peel wrappers and dispatch by node family; JSX visits attributes before children in source order; each target whose props read a style prop yields an edge — with destructured props passed on under their own name (directly or through spreads) recorded as forwarded.
