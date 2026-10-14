/**
 * Book's own compile. Stories, fixtures and __e2e__ harnesses carry style
 * call-sites that lib's published include (../ui.config.ts) leaves out, so Book
 * syncs into book/.reference-ui: shipped source plus the Book-only files.
 * Same name and layers as lib, so the classes match. Never published.
 */

import { defineConfig } from '@reference-ui/neo'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'

export default defineConfig({
  name: 'reference-ui',
  // The config file itself is not a source: its icon and neo imports would
  // pull their modules into Book's fragments.
  // Keep the unrooted `**` here: a rooted `../book/**` form drops files from
  // the compile, which changes Book's sheet.
  include: ['../src/**/*.{ts,tsx}', '!../src/index.ts', '**/*.{ts,tsx}', '!ui.config.ts'],
  extends: [],
  layers: [iconsBaseSystem],
  debug: false,
})
