# Styletrace fixtures

Workspace-level trace fixtures outside the station corpus. The sync-root tree is a mock app root with sources and a UI config that resolver and analysis tests trace against for sync-root hints and repo-level scenarios.

`sync-root/.reference-ui` is committed, not generated. It is a hand-written stand-in for the synced `@reference-ui/react` and `@reference-ui/styled` declarations: the primitives and the StyleProps names the station suites resolve against. A real `ref sync` writes the full generated surface, but that run needs the whole reference-core project, so the tests read this copy and need no setup step. The root `.gitignore` re-includes that one path. Add a name here when a station needs it, and never paste generated sync output into it.
