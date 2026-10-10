# coordination

The sibling-part problem: Overlay closes its Backdrop and Content together,
and the overlay must not tear down until the slowest part finishes its exit.
The ledger counts registrations against finished reports and notifies
subscribers on a microtask once every part has reported while closed — a
lone part never enters the protocol, and reopening clears the count. The
hook wraps the ledger in refs; this folder owns the counting.
