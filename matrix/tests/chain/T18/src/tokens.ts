import { tokens } from '@reference-ui/core'

/**
 * T18 novel probe tokens, one per probe. They are consumer-local: lib, icons
 * and the fixture never compiled them, so a backing rule for any of them can
 * only come from this consumer's compile, and one probe's rules (one per system
 * its renderer names) never back another probe's class. The spec proves their
 * absence from every published sheet. Values mirror `T18_PROBES.computed`.
 */
tokens({
  colors: {
    t18LibInk: { value: 'rgb(161, 18, 92)', description: 'T18 lib/primitives Button probe.' },
    t18NamespaceInk: { value: 'rgb(18, 92, 161)', description: 'T18 namespace-import probe.' },
    t18IconInk: { value: 'rgb(92, 161, 18)', description: 'T18 composed-icons probe.' },
    t18AcmeInk: { value: 'rgb(140, 61, 7)', description: 'T18 third-party Button probe.' },
    t18BarrelInk: { value: 'rgb(7, 140, 61)', description: 'T18 relative-barrel probe.' },
    t18WrapInk: { value: 'rgb(61, 7, 140)', description: 'T18 same-file css wrapper probe.' },
  },
  spacing: {
    t18TileGap: { value: '17px', description: 'T18 published-wrapper (Tile) probe.' },
  },
})
