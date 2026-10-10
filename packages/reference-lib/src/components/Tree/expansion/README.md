# expansion

How Tree emits expansion changes: single toggles and batch sibling sets
fold into the expanded array with known branches in document order and
unknown application values trailing. A pure reducer — the expansion
hook calls it and emits once through the controlled path.
