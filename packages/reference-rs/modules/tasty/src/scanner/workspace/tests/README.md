# Workspace discovery tests

Traversal pins over temp-dir fixtures. Dangling links skip, and a file reached only through a loop link is listed under that link; external re-exports, barrel hops above output layouts, globbed module files, and stylesheet imports each lay out a workspace and scan it; resolver memoization and library boundaries stay pinned.
