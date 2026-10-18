// Project barrel for the CORE-CHAIN-15 world. It takes the prebuilt package's `Button` and emits it re-exported under the
// same name, the way apps gather components behind `src/ui`. Its importers see a relative import, so only the end of the
// re-export chain says the component renders through the package's runtime.
export { Button } from '@fixture/chain15'
