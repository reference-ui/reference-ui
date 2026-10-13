/**
 * Local app entry for the default_reexport_package station.
 * Re-exports the default export of fixture-style-default under the component's own name, and
 * again under the alias PackageCard. The mock package lives under input/packages so git can
 * track it; compile remaps that folder to node_modules.
 */
export { default } from 'fixture-style-default'
export { default as PackageCard } from 'fixture-style-default'
