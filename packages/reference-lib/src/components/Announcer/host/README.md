# host

The single-host election that keeps one document from double-speaking.
The first AnnouncerHost to claim a document wins; every later mount on
that document renders null until the winner releases. Election is keyed
by Document so iframe documents choose independently, and it knows
nothing about messages or stores — the session hook calls it on mount
and unmount, and the root reads the winner before rendering.
