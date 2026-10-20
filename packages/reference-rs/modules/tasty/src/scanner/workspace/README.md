# Workspace discovery

Include globs into the reachable file set. Walks the globs into sorted root-relative ids (following symlinks, skipping dead links, failing only on real walk errors), crawls the import graph from user files inside the boundary, and applies the import policy that decides which imports bridge libraries into the index.
