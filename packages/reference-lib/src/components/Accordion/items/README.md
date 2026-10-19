# items

"Who belongs" — the collection's reading of its authored children.
Detection names an item by identity or disclosure duck-typing;
collection gathers authored ids in render order and enforces the
contract in dev (missing, empty, and duplicate ids throw; competing
child control warns); scoping re-wraps each item's children under a
null provider so nested standalones stay free of the outer policy.

Up: Accordion.
