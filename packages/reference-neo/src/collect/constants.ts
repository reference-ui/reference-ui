// Collect-wide constants: discovery needles, scan mirrors, and source tags.
// They take nothing and emit the literals the pipeline stages share. The
// scan needles and native mirrors must match the engine byte-for-byte, and
// the source tags travel on collected fragments into provenance.

// Fragment discovery needles: the module ids whose imports mark a fragment
// file. Shared by the TS and native scans so the union can never drift.
export const FRAGMENT_IMPORT_NEEDLES = [
  '@reference-ui/neo',
  '@reference-ui/neo/config',
  '@reference-ui/system',
  '@reference-ui/core/config',
  '@reference-ui/cli/config',
]

// Source tag for upstream bundles when the extends entry carries no name.
// Neo tags named upstreams with their system names instead, so the private
// gate matches membership in the upstream name set — never this literal
// alone, or every named upstream would leak through.
export const UPSTREAM_FRAGMENT_SOURCE = 'upstream system fragment'

// Fragment bundles are plain IIFEs. This global tells collector calls which
// source file is currently executing so diagnostics can point back to filenames.
export const CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY = '__refCurrentFragmentSource'

export const CONFIG_FRAGMENT_SOURCE_PROPERTY = '__refConfigFragmentSource'

// Retention glob prunes only node_modules at traversal (the huge tree);
// the remaining native IGNORE dirs filter explicitly below so the mirror
// stays reviewable instead of trusting glob-pattern equivalence.
export const RETENTION_EXCLUDE = ['**/node_modules/**']

// Native IGNORE dirs mirrored from sources.rs handle_dir_entry: paths with
// any relative DIRECTORY segment in this set never reach the engine.
export const NATIVE_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'target',
  '.reference-ui',
  '.reference',
  '.pipeline',
])

// Engine-parsed extensions mirrored from sources.rs is_supported_extension:
// the final extension decides, so foo.d.ts (ext ts) is a source.
export const SOURCE_EXTENSIONS = new Set(['tsx', 'ts', 'jsx', 'js'])
