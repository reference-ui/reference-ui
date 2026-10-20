# Staging census tests

Edge matching pinned against the scope visitor's own import refs. Each snippet parses once, then the module record's outgoing specifiers and the scope refs must name the same locals, so the census and the walker cannot drift.
