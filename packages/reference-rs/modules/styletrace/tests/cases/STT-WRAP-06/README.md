# STT-WRAP-06 — A wrapper that forwards its remaining props with rest spread is traced, and peeling off non-style fields first does not hide it

Traces a wrapper that forwards remaining props onto a Reference primitive.
Non-style fields are peeled off; the rest bag is StyleProps.
Card and its body-destructured twin BodyRestCard are the style-bearing exports.
