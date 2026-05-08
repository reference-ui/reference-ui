# Vite 7 Templates

This folder contains the Liquid templates used by the managed `vite7` bundler module.

- `index.html.liquid` renders the managed HTML shell for Vite-backed matrix fixtures and generated consumers.
  It defines the React mount node and the managed `src/main.tsx` entry script.
- `vite.config.ts.liquid` renders the managed Vite config used by the matrix runner.
  It wires the React plugin, `referenceVite()`, and the entry-script patch for fixtures whose HTML shell does not already reference `src/main.tsx`.