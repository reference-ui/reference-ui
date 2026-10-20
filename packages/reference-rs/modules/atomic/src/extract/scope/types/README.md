# Type-driven bindings

Bindings from type positions. Destructured params bind against folded type-literal annotations (values where members fold, shadows where they do not, rest taking the unlisted members); TS enums lower to the const objects their initialized members name; valueless shadows keep outer consts from leaking through patterns.
