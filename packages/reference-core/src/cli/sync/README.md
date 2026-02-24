# Sync

Sync should **never EVER** have logic inside of it. Its only purpose is to run init.

All orchestration, event wiring, and coordination live in the init modules. Sync simply calls them in order.
