---
'@reference-ui/icons': patch
---

Remove the generated `src/jsx-names.ts` module and the `jsxElements` crutch from `ui.config.ts`. Host discovery now comes from StyleTrace per compile, so the generated name roster is no longer needed. Internal note: `packages/reference-mcp/scripts/generate-icons-metadata.mjs` still imports the deleted module and must switch to the generated `src/generated/index.ts` barrel.
