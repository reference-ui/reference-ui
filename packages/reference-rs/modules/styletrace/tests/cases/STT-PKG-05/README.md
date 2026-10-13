# STT-PKG-05 — A default re-export is named after the component it re-exports

`export { default } from 'fixture-style-default'` re-exports the package's default export, which is declared as DefaultCard. It mints DefaultCard, not `default`, because a JSX consumer spells the component name and `default` is not one.
`export { default as PackageCard } from` keeps its alias and mints PackageCard.
