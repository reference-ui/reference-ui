# Diagnostic code tests

Table-level contract for the stable codes. Every row round-trips through serialization and parsing, every variant appears exactly once, the shared template agrees on namespace and severity, and the wire module keeps the string form identical in every direction with refusal — never guessing — on unknown strings.
