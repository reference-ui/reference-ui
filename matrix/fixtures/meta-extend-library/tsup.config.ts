import { defineConfig } from 'tsup'
import { SHIPPABLE_UNIT_EXTERNALS } from '../../../packages/reference-neo/src/packager/externals.ts'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  // Neo runtimes are system-namespaced: the fixture bundles its own
  // @reference-ui/react + @reference-ui/system providers so packed
  // consumers resolve identically to workspace consumers (PKG-STABILITY).
  // Only react (host-provided, dispatcher-safe) and the upstream fixture
  // package (declared dependency, installed nested) stay external. The
  // runtime list is owned by the Neo packager (NEO-PACKAGER): fixtures
  // import it, never mirror it, so the policy can only drift in one place.
  external: [...SHIPPABLE_UNIT_EXTERNALS, '@fixtures/extend-library'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
})
