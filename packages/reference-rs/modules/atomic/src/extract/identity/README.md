# Import identity walk

Where one import's binding comes from, past project re-exports. Traces named re-exports, re-exported imports, and star barrels, entering each `(file, name)` once per query so an export cycle costs one visit; probes bare specifiers as project aliases or packages through the shared module ladder; resolves relative spellings and hop implications without touching the filesystem.
