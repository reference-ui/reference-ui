# Managed Webpack 5

Webpack 5 config surface for matrix fixtures and generated consumers. Renders the managed HTML shell (React mount node for the generated entrypoint) and the webpack dev config wiring TypeScript, CSS handling, and the shared shell, and re-exports the centrally pinned webpack 5 dev dependencies. ts-loader compiles through a typescript 6.x alias (`typescript-6`) because typescript 7 removed the JavaScript compiler API that ts-loader calls.
