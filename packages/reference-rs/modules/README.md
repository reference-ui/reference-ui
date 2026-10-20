# Modules

The compiler workspace: one Rust crate plus its TypeScript sibling per product. Each crate carries its own README and self-verification.

The atomic style engine is TypeScript above the cut and Rust below: authors write real TypeScript, fragments collect the build-time calls in JavaScript, and Rust consumes the dump without ever evaluating author files. `canon` is the language (tags, properties, aliases, conditions); `base-system` is one system's definition (tokens, fonts, keyframes, globals, recipes); `atomic` compiles extract output into a stylesheet plus class map; `typegen` prints the declarations; `styletrace` traces which components still carry StyleProps. The engine emits layered `styles.css` and the matching types.

The other products are separate tools: `tasty` bundles typed component APIs, `atlas` observes component usage, `module-graph` walks module records, `primitives` ships the component vocabulary, and `diagnostics` renders compiler diagnostics. `runtime` hosts the single Node-API addon and its loader; `shared` holds the text, span, and AST helpers every crate uses. An interactive module map sits beside the crates for navigation.
