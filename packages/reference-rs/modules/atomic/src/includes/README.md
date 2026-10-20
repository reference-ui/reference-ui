# Include scoping

Glob scoping for source discovery. Compiles the frozen request's include patterns once so the disk scan and the legacy virtual file list honor one scope: `**` crosses directories, `*` and `?` stay in a segment, braces expand, classes match one character, leading `!` negates. An absent or empty list leaves the scope open.
