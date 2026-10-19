# hooks

The React bindings, one factory per hook, each bound to a single slot
context by `context`. The filler hook registers the live container
from `registration/` and manages its lifecycle; the two read hooks
subscribe to the `registry/` version and select at snapshot time.

Factories instead of plain hooks keep every `createSlotRootContext`
call an isolated universe: contexts never share state, only the id
sequence from `shared/`. The read hooks share one subscription shape —
version-based, so inline filter closures never resubscribe — and the
multi-read caches its filtered result element-wise so unrelated
registrations preserve array identity downstream.
