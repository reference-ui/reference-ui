# CORE-WATCH-21 — a generated directory replaced by a file heals on the next sync instead of failing with EEXIST on every run

The spec builds a temp world and syncs it. It then replaces the generated `styled/` directory with a plain file and
changes the brand, so the commit must put a directory where a file stands. Both the first sync and the next one must
exit 0. The second run proves the fix heals rather than merely recovering once: `styled/` is a directory again, and
its sheet carries the new brand. The file that stood in the way is moved aside by the commit and dropped when it lands.

> Search terms: file in the way, EEXIST, directory replaced by file, styled, mkdir, stuck sync, heal, CORE-WATCH-21
