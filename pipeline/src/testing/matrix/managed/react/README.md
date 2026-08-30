`react/` owns the matrix fixtures' managed browser runtime profiles.

Each profile fixes the React version set, the DOM mount API (`createRoot` vs
`render`), the mountpoint, and the generated `src/main.tsx` entrypoint that
setup materializes into every matrix fixture.

Supported runtimes: `react17`, `react18`, `react19`. A package can declare
several; the first entry is the default, and `pipeline test --react` pins one
declared runtime. React 17's profile sets `mountApi: "render"` because
`createRoot` did not exist yet.