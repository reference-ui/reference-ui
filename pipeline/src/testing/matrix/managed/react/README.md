# Managed Matrix React

Managed browser runtime profiles for matrix fixtures. Each profile fixes the React version set, the DOM mount API, the mountpoint, and the generated browser entrypoint that setup materializes into every fixture.

Supported runtimes: `react17`, `react18`, `react19`. A package can declare several; the first entry is the default and `pipeline test --react` pins one. React 17 sets `mountApi: "render"` because `createRoot` did not exist yet.
