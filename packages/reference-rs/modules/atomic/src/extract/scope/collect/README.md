# Binding collection

One pass recording every value binding in scope. Declarators carry their init through the ordered chain (const objects, aliases, factory names, member reads, token folds, literal leaves); params and imports bind with or without values; token inits record their folded references; a clearing pass drops optimistically recorded inits whose callee proves foreign.
