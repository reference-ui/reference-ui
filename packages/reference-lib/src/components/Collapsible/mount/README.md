# mount

"What stays in the tree" — the stay-mounted policies. Hidden-until-found
keeps closed content mounted but hidden for browser find, force-mount
keeps it mounted and interactive as the escape hatch, and precedence
settles their overlap (Content prop over root default, findability over
force). The same module guards the `beforematch` reveal: live, closed,
and uncancelled, or it stays shut.

Up: Collapsible.
