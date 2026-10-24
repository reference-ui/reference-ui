# Scanner layer

File discovery, import resolution, and id normalization. Discovers scan files under the root, resolves imports to files across relative, package, and workspace shapes, crawls the reachable graph inside the scan boundary, and converts paths to stable file and symbol ids without touching the filesystem for normalization itself.

The crawl reads each file once and runs the nesting gate on it once (`ScreenedSource::screen`). The screened text rides on the
`DiscoveredFile` into the `ScannedFile`, so `scan_workspace` does not read the file again and extraction does not screen it
again. A file is parsed twice, because the two parses ask different questions: the crawl parse takes the import and re-export
specifiers that decide which files exist, and the extraction parse needs the final file set, which the crawl has not produced
until it ends. Both parse the same screened text (`parse_screened`), so a refused file is reported once, by extraction. The
crawl lends the import policy its set of known file ids instead of copying it for every file, which keeps the crawl linear in
the number of files.
