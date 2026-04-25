import { globalCss } from '@reference-ui/system'
import { baseTypography } from './shared'

export const mediaPrimitiveStyles = {
  '.ref-figure': {
    ...baseTypography,
    marginInline: '0',
    marginBlock: '6r',
  },

  '.ref-figcaption': {
    ...baseTypography,
    color: '{colors.ui.media.caption.foreground}',
    fontSize: '3.5r',
    lineHeight: '5r',
    marginTop: '2r',
  },

  '.ref-img, .ref-picture, .ref-video, .ref-canvas, .ref-svg': {
    display: 'block',
    maxWidth: '100%',
  },

  '.ref-img, .ref-video, .ref-canvas': {
    height: 'auto',
    borderRadius: 'md',
  },

  '.ref-audio': {
    display: 'block',
    width: '100%',
  },

  '.ref-iframe, .ref-embed, .ref-object': {
    display: 'block',
    maxWidth: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.media.embed.border}',
    borderRadius: 'md',
  },
} as const

globalCss(mediaPrimitiveStyles)
