# hooks

Combobox behavior as composable hooks over one session. The session owns
every ref and state cell; the registry owns mounted options; authority
resolves the authored collection; active, open, and sources own their
state; virtual core and cells drive logical adapters; the tree bridge
publishes expansion; text and commits own the edit session; the resolver
settles opens; announcements speak status; and the input/trigger hooks
wire the focus sources. Effects run in their original order — metadata
reset, source check, transition, resolve, mount, follow, re-arm, busy,
announce — and every pure decision the hooks wrap lives in a tested
module.
