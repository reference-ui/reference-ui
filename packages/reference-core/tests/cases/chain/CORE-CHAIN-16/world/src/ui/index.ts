// Project barrel for the CORE-CHAIN-16 world. It takes the installed package's `Button` and emits it re-exported under the
// same name. Its importers see a relative import, so the warning has to follow the re-export to the package it ends at.
export { Button } from '@fixture/chain16'
