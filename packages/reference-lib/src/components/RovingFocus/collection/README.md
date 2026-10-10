# collection

The registered item set as the kernel sees it: ordered by live document
position, filtered by a single availability predicate, and repaired when
the current entry goes stale. Ordering drops disconnected nodes and sorts
by geometry so keyed insert, reorder, and removal need no bookkeeping.
Availability unifies the prop, native, ARIA, and computed-style signals.
Repair resolves next-then-previous successors against the last committed
order, which still contains a removed id the live map has already lost.
