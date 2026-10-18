# NEO-PGEN-16 — E4's token positions are real unions: literals assign, mistypes fail TS2322.

A known literal assigns at the ColorToken position and at E4's color
position, and the category-prefixed spelling assigns where P-prim-1 allows. A
number at the string-domain color position fails with TS2322, proving the
narrowing rode the E4 file instead of collapsing to unknown. Related:
NEO-PGEN-15 (props everywhere), NEO-TYPE-02 (the ColorToken precedent).

The open-hatch positions stay permissive per TYP-STRICT-04, and this case
documents the split instead of hiding it: color anti-literals like nope assign
through the string hatch (pinned exit-0 in the positive file), while a value
outside the string domain fails. If a future bake narrows the hatch, the
positive file is the manifest of what must keep assigning.
