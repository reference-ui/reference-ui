# Workspace discovery tests

Traversal pins over temp-dir fixtures. Dangling links skip, a file reached only through a loop link is listed under that link, and a missing or unreadable scan root or an include glob with an unclosed class fails the scan; external re-exports, barrel hops above output layouts, globbed module files, and stylesheet imports each lay out a workspace and scan it; resolver memoization and library boundaries stay pinned.
