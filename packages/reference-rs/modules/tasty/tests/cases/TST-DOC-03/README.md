# TST-DOC-03 — jsdoc: a trailing // comment on one member never leaks into the next member's JSDoc

Verifies that a `//` comment sharing a line with a member's code belongs to nothing: the next member's description and JSDoc come only from its own leading block.
Covers an interface and an alias object literal, a member with and without its own JSDoc after the trailing comment, and a standalone `//` line above a member that still attaches.
Proves primary SPEC ID anchor TST-DOC-03.
