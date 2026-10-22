# Source discovery

Request inputs into sorted path-content pairs for extraction. Takes the virtual file list or a root directory; the disk scan skips build and metadata directories plus non-source extensions; the include scope then filters both arms to matching files. Backfill, gather, request, and walk split the union, traversal, and retention-token paths.

The walk (`walk.rs`) is one traversal shared by the collecting scan and the union backfill. A symlinked directory is entered once per real target and never back into an ancestor, so a loop ends at the link that closes it; a file is listed once, under its real path when one exists and under a link alias only when no real path lists it. The union backfill claims each provided file's canonical identity before it walks, so a listed file reached again through a link is never read twice. Styletrace's source discovery follows the same rule, and the JS listing does too, so the two sides enumerate one file set.
