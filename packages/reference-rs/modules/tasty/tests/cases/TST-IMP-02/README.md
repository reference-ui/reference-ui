# TST-IMP-02 — An import from a relative file that does not exist warns TST-W-UNRESOLVED-IMPORT and the type stays an external reference

Verifies that a type imported from a relative specifier with no file behind it is reported once as an
unresolved import, with the file and the specifier named in the message.
Verifies that the reference itself is kept as an external reference naming the specifier as its library, so
the missing target is visible rather than silently dropped.
Proves primary SPEC ID anchor TST-IMP-02.
