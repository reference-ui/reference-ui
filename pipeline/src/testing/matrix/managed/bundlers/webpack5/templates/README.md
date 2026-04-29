# Webpack 5 Templates

This folder contains the Liquid templates used by the managed `webpack5` bundler module.

- `index.html.liquid` renders the managed HTML shell for webpack-backed matrix fixtures and generated consumers.
  It defines the React mount node that the managed `src/main.tsx` entrypoint targets.
- `webpack.config.cjs.liquid` renders the managed webpack development config used by the matrix runner.
  It wires TypeScript, CSS handling, the shared HTML shell, and `referenceWebpack()`.