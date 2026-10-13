# STT-BAR-11 — A namespace re-export names each reached component through the namespace

`export * as UI from 'fixture-ui-kit'` exposes the package's components only through the namespace, so Button and Card trace as UI.Button and UI.Card. The bare names Button and Card do not leak from the barrel.
The package's Plain component exposes no StyleProps and mints nothing.
