import { tokens } from '@reference-ui/core'

/**
 * Novel consumer-local tokens for the partly-composed sync leg. They resolve,
 * so the only thing wrong with the fixture tags is that nothing backs them;
 * the lib token is the leg's positive control.
 */
tokens({
  colors: {
    t18PartialAcmeInk: { value: 'rgb(106, 29, 150)', description: 'T18 partial leg: fixture Button.' },
    t18PartialLibInk: { value: 'rgb(29, 150, 106)', description: 'T18 partial leg: lib Button (control).' },
  },
  spacing: {
    t18PartialTileGap: { value: '13px', description: 'T18 partial leg: fixture Tile.' },
  },
})
