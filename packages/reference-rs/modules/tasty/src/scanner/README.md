# Scanner layer

File discovery, import resolution, and id normalization. Discovers scan files under the root, resolves imports to files across relative, package, and workspace shapes, crawls the reachable graph inside the scan boundary, and converts paths to stable file and symbol ids without touching the filesystem for normalization itself.
