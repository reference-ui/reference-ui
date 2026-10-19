# shared

The nameless plumbing every FocusLock behavior stands on: reading and writing
focus, testing lock membership, resolving the caller's target vocabulary, and
fanning the host node into refs. Nothing here knows about locks, tab order, or
restore — it only answers small element questions so the domain folders can ask
them without repeating DOM edge cases.

Up: FocusLock.
