import {
  Abbr,
  B,
  Blockquote,
  Cite,
  Code,
  Div,
  Em,
  I,
  Kbd,
  Mark,
  P,
  Pre,
  Q,
  S,
  Samp,
  Small,
  Span,
  Strong,
  Sub,
  Sup,
  U,
  Var,
} from '@reference-ui/react'

/**
 * Typography specimens for the Typography page. Kept in a component (not MDX)
 * so the style props are statically extracted — inline JSX in MDX is not.
 */
function FontCard({ name, font, sample }: { name: string; font: 'sans' | 'serif' | 'mono'; sample: string }) {
  return (
    <Div
      bg="docsPanelBg"
      borderRadius="md"
      padding="4r"
      display="flex"
      flexDirection="column"
      gap="3r"
    >
      <Span fontSize="sm" fontWeight="600" color="docsMuted">
        {name}
      </Span>
      <Div font={font} fontSize="5r" lineHeight="1.3" color="docsText">
        {sample}
      </Div>
    </Div>
  )
}

export function FontFamilies() {
  const sample = 'The quick brown fox jumps over the lazy dog.'
  return (
    <Div
      display="grid"
      gridTemplateColumns="1fr"
      gap="4r"
      r={{ 640: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } }}
    >
      <FontCard name="Sans · Inter" font="sans" sample={sample} />
      <FontCard name="Serif · Literata" font="serif" sample={sample} />
      <FontCard name="Mono · JetBrains Mono" font="mono" sample={sample} />
    </Div>
  )
}

export function WordOverlay() {
  return (
    <Div
      position="relative"
      width="100%"
      maxWidth="640px"
      height="110px"
      overflow="hidden"
      borderRadius="md"
      bg="docsPanelBg"
    >
      <Div
        font="sans"
        position="absolute"
        top="12px"
        left="16px"
        fontSize="64px"
        lineHeight="76px"
        opacity={0.85}
        whiteSpace="nowrap"
        color="docsText"
      >
        Typography
      </Div>
      <Div
        font="serif"
        position="absolute"
        top="12px"
        left="16px"
        fontSize="64px"
        lineHeight="76px"
        opacity={0.5}
        whiteSpace="nowrap"
        color="docsHighlight"
      >
        Typography
      </Div>
      <Div
        font="mono"
        position="absolute"
        top="12px"
        left="16px"
        fontSize="64px"
        lineHeight="76px"
        opacity={0.28}
        whiteSpace="nowrap"
        color="docsHighlight"
      >
        Typography
      </Div>
    </Div>
  )
}

const SENTENCE =
  'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!'

export function SentenceOverlay() {
  return (
    <Div
      position="relative"
      width="100%"
      maxWidth="640px"
      height="220px"
      overflow="hidden"
      borderRadius="md"
      bg="docsPanelBg"
    >
      <Div
        font="sans"
        position="absolute"
        top="16px"
        left="16px"
        right="16px"
        fontSize="30px"
        lineHeight="40px"
        opacity={0.85}
        color="docsText"
      >
        {SENTENCE}
      </Div>
      <Div
        font="serif"
        position="absolute"
        top="16px"
        left="16px"
        right="16px"
        fontSize="30px"
        lineHeight="40px"
        opacity={0.5}
        color="docsHighlight"
      >
        {SENTENCE}
      </Div>
      <Div
        font="mono"
        position="absolute"
        top="16px"
        left="16px"
        right="16px"
        fontSize="30px"
        lineHeight="40px"
        opacity={0.28}
        color="docsHighlight"
      >
        {SENTENCE}
      </Div>
    </Div>
  )
}

export function EmphasisSamples() {
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <P margin="0" color="docsText">
        This is a paragraph. It flows naturally and carries the system line height.
      </P>
      <P margin="0" color="docsMuted">
        <Small>Small text for fine print and captions.</Small>
      </P>
      <P margin="0" color="docsText">
        <Strong>Strong for importance</Strong>, <Em>emphasis for stress</Em>, <B>bold</B>,{' '}
        <I>italic</I>, <U>underline</U>, and <S>strikethrough</S>.
      </P>
      <P margin="0" color="docsText">
        Highlight with <Mark bg="docsActiveBg" color="docsText">a mark</Mark>, and drop reference
        like H<Sub>2</Sub>O or E = mc<Sup>2</Sup>.
      </P>
    </Div>
  )
}

export function TechnicalSamples() {
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <P margin="0" color="docsText">
        Use{' '}
        <Code fontFamily="mono" bg="docsInlineCodeBg" color="docsText" paddingX="1r" paddingY="0.5r" borderRadius="sm">
          const
        </Code>{' '}
        for constants.
      </P>
      <P margin="0" color="docsText">
        Press{' '}
        <Kbd bg="docsInlineCodeBg" color="docsText" paddingX="2r" paddingY="1r" borderRadius="sm" border="1px solid" borderColor="docsBorder">
          Cmd
        </Kbd>{' '}
        +{' '}
        <Kbd bg="docsInlineCodeBg" color="docsText" paddingX="2r" paddingY="1r" borderRadius="sm" border="1px solid" borderColor="docsBorder">
          S
        </Kbd>{' '}
        to save.
      </P>
      <P margin="0" color="docsText">
        Output: <Samp fontFamily="mono" color="docsHighlight">Hello, World!</Samp> — variable{' '}
        <Var fontStyle="italic" color="docsHighlight">x</Var> holds the input.
      </P>
    </Div>
  )
}

export function QuoteSamples() {
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <Blockquote
        color="docsMuted"
        borderLeft="4px solid"
        borderLeftColor="docsBlockquoteBorder"
        paddingLeft="4r"
        marginY="4r"
        fontStyle="italic"
      >
        The best way to predict the future is to invent it.
      </Blockquote>
      <P margin="0" color="docsText">
        As they say, <Q color="docsHighlight">less is more</Q>.
      </P>
      <P margin="0" color="docsMuted">
        <Cite fontStyle="normal">— Alan Kay</Cite>
      </P>
      <P margin="0" color="docsText">
        The{' '}
        <Abbr title="World Wide Web" color="docsHighlight" textDecoration="underline dotted" cursor="help">
          WWW
        </Abbr>{' '}
        changed everything.
      </P>
    </Div>
  )
}

export function PreSample() {
  return (
    <Pre bg="docsPanelBg" color="docsText" borderRadius="md" padding="4r" overflow="auto">
      {`function greet() {
  return 'Hello'
}`}
    </Pre>
  )
}
