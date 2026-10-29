# TST-DOC-04 — jsdoc: a file's top-of-file header comment is never the first declaration's description

Verifies that a comment block that begins the file and is followed by a blank line documents the file, so the first declaration gets no description from it.
Covers an undocumented interface after a header, a documented alias after a header (keeps only its own doc), and a file that starts directly with a documented declaration (attaches).
Proves primary SPEC ID anchor TST-DOC-04.
