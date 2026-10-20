# Constant collection

Recording of const array and object elements plus literal leaves. Arrays record only when fully literal or static; branching initializers flatten into literal leaves with a dropped flag on non-literal positions so callers keep the union while test folding stays open.
