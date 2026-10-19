// Config for the CORE-CHAIN-17 monorepo root. It takes the root's tokens and the sources of both workspaces, the app
// in apps/web and the component package in packages/ui, and emits one system that spans them: the one-system shape.
// The spec rewrites this file to compose the package's own system under extends, then under layers, and restores this
// exact spelling in a finally, so the tree stays canonical.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain17',
  include: ['theme/**/*.{ts,tsx}', 'apps/web/src/**/*.{ts,tsx}', 'packages/ui/src/**/*.{ts,tsx}'],
  extends: [],
})
