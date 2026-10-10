# hooks

Tree behavior as composable hooks over one session. The session owns
every ref and state cell plus the identity registry; expansion owns
branch order, emission, and the Combobox bridge; selection owns commits;
focus owns the tab stop and recovery; keyboard owns the item command
dispatcher; and the two item hooks wire one row's registration and
interaction. Effects run in their original order — bridge, ensure,
metadata, recover — and every pure decision the hooks wrap lives in a
tested domain module.
