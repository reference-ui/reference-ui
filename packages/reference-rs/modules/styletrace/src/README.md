# Styletrace native sources

Two subsystems behind one entrypoint. A synced type-surface resolver expands StyleProps names from declarations, and a JSX wrapper analyzer traces public components back to primitives. Takes workspace or file paths and emits collected style properties or the analyzed component graph.
