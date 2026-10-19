# stack

Nesting arbitration for coexisting locks. Only the top lock per Document may
reclaim or loop Tab; activating a nested lock pauses its parent, and
deactivating out of order never resurrects a dead middle entry. The stack is
module state scoped by ownerDocument, so same-document locks share one pause
chain while each iframe document contains only its own.

Up: FocusLock.
