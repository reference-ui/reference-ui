import { css } from '@reference-ui/react'

/**
 * Style vocabulary for the reference-pipeline specimen: the canvas header, the
 * stage heads and their badges, card and code surfaces, the analysis chips, the
 * canon progress bars, and the browser-runtime mock. Content stays in the
 * specimen; this file is only the classes, so both stay readable. Every value is
 * a literal — no spreads — so the extractor reads each call site directly.
 */

export const canvasHead = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const brand = css({ display: 'flex', alignItems: 'center', gap: '2r' })

export const brandTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

export const brandRange = css({ fontFamily: 'mono', fontSize: 'sm', color: 'docsMuted', lineHeight: '1.4' })

export const rule = css({
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'diagramBorder',
})

export const stageHead = css({ display: 'flex', alignItems: 'center', gap: '3r' })

export const stageNo = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  fontWeight: '600',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'sm',
  lineHeight: '1.4',
  color: 'docsText',
  bg: 'diagramChip',
})

export const stageNoBlue = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  fontWeight: '600',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'sm',
  lineHeight: '1.4',
  color: 'diagramBlueText',
  bg: 'blue.500/strong',
})

export const stageNoGreen = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  fontWeight: '600',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'sm',
  lineHeight: '1.4',
  color: 'diagramGreenText',
  bg: 'green.500/strong',
})

export const stageTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

export const spacer = css({ flex: '1' })

export const stageTag = css({
  fontSize: 'sm',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'docsMuted',
  lineHeight: '1.4',
})

export const tagPillBlue = css({
  fontSize: 'sm',
  fontWeight: '600',
  paddingX: '3r',
  paddingY: '1r',
  borderRadius: 'full',
  lineHeight: '1.4',
  whiteSpace: 'nowrap',
  color: 'diagramBlueText',
  bg: 'blue.500/strong',
})

export const cardHead = css({ display: 'flex', alignItems: 'center', gap: '2r' })

export const cardTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  lineHeight: '1.3',
})

/* Title ink by panel tone: a toned panel titles in its own lighter shade; a
 * neutral panel titles in near-white. Body text always stays docsText. */
export const textDefault = css({ color: 'docsText' })
export const textBlue = css({ color: 'diagramBlueText' })
export const textGreen = css({ color: 'diagramGreenText' })
export const textAmber = css({ color: 'diagramAmberText' })

export const cardSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

export const codeBlock = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'docsText',
  borderRadius: 'sm',
  padding: '3r',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
})

export const analysisTitle = css({
  fontSize: '5r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  lineHeight: '1.3',
})

export const pillGreen = css({
  fontSize: 'sm',
  fontWeight: '600',
  paddingX: '3r',
  paddingY: '1r',
  borderRadius: 'full',
  lineHeight: '1.4',
  whiteSpace: 'nowrap',
  color: 'diagramGreenText',
  bg: 'green.500/strong',
})

export const checkBox = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  borderRadius: 'sm',
  padding: '3r',
})

export const checkRow = css({ display: 'flex', alignItems: 'center', gap: '2r' })

export const checkText = css({ fontSize: 'sm', color: 'docsText', lineHeight: '1.5' })

export const chips = css({ display: 'flex', flexWrap: 'wrap', gap: '1r', justifyContent: 'center' })

export const chip = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'docsText',
  paddingX: '2r',
  paddingY: '1r',
  borderRadius: 'full',
  lineHeight: '1.4',
})

/* Inset trays take the section's tone: a neutral stage insets in slate, a toned
 * stage insets in its own family, so every element belongs to its section. */
export const trayNeutral = css({ bg: 'diagramChip' })

export const trayBlue = css({
  bg: 'blue.500/firm',
})

export const trayGreen = css({
  bg: 'green.500/firm',
})

export const bars = css({ display: 'flex', gap: '1r' })

export const bar = css({ flex: '1 1 0', height: '3r', borderRadius: 'full' })

export const barOn = css({
  bg: 'blue.500/solid',
})

/* The canon meter lives in the blue stage, so its track is a blue shade too. */
export const barOff = css({
  bg: 'blue.500/firm',
})

export const windowRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3r',
  bg: 'diagramChip',
  padding: '2r',
  borderRadius: 'sm',
})

export const windowChip = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: 'diagramPanel',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'diagramBorder',
  borderRadius: 'sm',
  padding: '1r',
  flexShrink: '0',
})

export const skeleton = css({ display: 'flex', flexDirection: 'column', gap: '1r', flex: '1' })

export const skeletonBar = css({ height: '1r', borderRadius: 'full', bg: 'diagramBorder' })

export const actionButton = css({
  fontSize: 'sm',
  fontWeight: '600',
  color: 'docsText',
  bg: 'diagramPanel',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'diagramBorder',
  borderRadius: 'sm',
  paddingX: '3r',
  paddingY: '1r',
  lineHeight: '1.4',
  whiteSpace: 'nowrap',
  flexShrink: '0',
})

export const dots = css({ display: 'flex', gap: '1r' })

export const dot = css({ width: '2r', height: '2r', borderRadius: 'full' })

export const dotRed = css({
  bg: 'red.500/solid',
})

export const dotAmber = css({
  bg: 'amber.500/solid',
})

export const dotGreen = css({
  bg: 'green.500/solid',
})
