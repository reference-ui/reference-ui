import '@reference-ui/react/styles.css'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Div, H1, P, Span } from '@reference-ui/react'
import { CtaCard } from './cta'

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [requests, setRequests] = useState(0)

  return (
    <Div
      id="launch-root"
      colorMode={mode}
      bg="launch.surface"
      color="launch.ink"
      minHeight="100vh"
      padding="launch.page"
      display="grid"
      justifyContent="center"
      alignContent="start"
    >
      <Div width="100%" maxWidth="1120px" display="grid" gap="launch.roomy">
        <Div display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="launch.gap">
          <Span font="display" weight="bold" fontSize="1.25rem">
            Fern Studio
          </Span>
          <Div display="flex" alignItems="center" gap="launch.small">
            <Span id="mode-readout" aria-live="polite" fontSize="0.875rem">
              Mode: {mode}
            </Span>
            <Button
              id="mode-toggle"
              type="button"
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              bg="launch.panel"
              color="launch.ink"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="launch.line"
              borderRadius="launch.pill"
              paddingX="launch.card"
              paddingY="launch.small"
              fontSize="0.875rem"
              _hover={{ opacity: 0.9 }}
            >
              Switch to {mode === 'dark' ? 'light' : 'dark'}
            </Button>
          </Div>
        </Div>

        <Div display="grid" gap="launch.gap">
          <H1
            id="brand-heading"
            font="display"
            weight="bold"
            margin="launch.zero"
            fontSize={{ base: '2.75rem', md: '4.5rem' }}
            lineHeight="1.02"
          >
            Small studio. Lasting roots.
          </H1>
          <P margin="launch.zero" fontSize="1.125rem" lineHeight="1.6" maxWidth="640px">
            We shape calm, durable brand systems for independent teams, then stay close while they grow.
          </P>
          <P id="font-default" font="display" margin="launch.zero" fontSize="1.25rem">
            Set in the second family, <Span id="font-child" weight="display.bold">with a bolder child</Span>.
          </P>
          <Div id="alias-probe" bg="launch.accent" width="48px" height="8px" borderRadius="launch.pill" />
          <Div display="flex" alignItems="center" flexWrap="wrap" gap="launch.small">
            <Button
              id="book-button"
              type="button"
              onClick={() => setRequests(requests + 1)}
              bg="launch.brand"
              color="launch.brandText"
              borderWidth="0"
              borderRadius="launch.pill"
              paddingX="launch.roomy"
              paddingY="launch.card"
              fontSize="1rem"
              fontWeight="700"
              _hover={{ opacity: 0.9 }}
            >
              Book a consultation
            </Button>
            <Span id="request-count" aria-live="polite">
              {requests} requests
            </Span>
          </Div>
        </Div>

        <Div id="page-container" container width="100%" display="grid" gap="launch.gap">
          <Div
            id="wide-grid"
            display="grid"
            gridTemplateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
            gap="launch.gap"
          >
            <CtaCard id="card-default">
              <Span font="display" weight="bold" fontSize="1.25rem">Rooted identity</Span>
              <P margin="launch.zero">A short, focused sprint for a clear starting point.</P>
            </CtaCard>
            <CtaCard id="card-compound" tone="quiet" density="roomy">
              <Span font="display" weight="bold" fontSize="1.25rem">Growing partner</Span>
              <P margin="launch.zero">Quiet support while your team finds its rhythm.</P>
            </CtaCard>
          </Div>
          <CtaCard id="card-override" tone="quiet" padding="launch.override">
            <Span font="display" weight="bold" fontSize="1.25rem">Utility override</Span>
            <P margin="launch.zero">A style prop wins over the recipe padding.</P>
          </CtaCard>
          <CtaCard id="card-responsive-wide" tone="quiet" density={{ base: 'compact', md: 'roomy' }}>
            <Span font="display" weight="bold" fontSize="1.25rem">Wide container</Span>
            <P margin="launch.zero">Roomy at the md breakpoint of the page container.</P>
          </CtaCard>
        </Div>

        <Div id="narrow-container" container width="360px" maxWidth="100%">
          <Div
            id="narrow-grid"
            display="grid"
            gridTemplateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
            gap="launch.gap"
          >
            <CtaCard id="card-responsive-narrow" tone="quiet" density={{ base: 'compact', md: 'roomy' }}>
              <Span font="display" weight="bold" fontSize="1.25rem">Narrow container</Span>
              <P margin="launch.zero">Embedded in 360px, so it stays compact.</P>
            </CtaCard>
          </Div>
        </Div>

        <Div
          id="nested-light"
          colorMode="light"
          bg="launch.panel"
          color="launch.ink"
          display="grid"
          gap="launch.small"
          padding="launch.card"
          borderRadius="launch.card"
        >
          <Span font="display" weight="bold">Nested light mode</Span>
          <Div id="nested-alias" bg="launch.accent" width="48px" height="8px" borderRadius="launch.pill" />
        </Div>

        <Div
          id="motion-probe"
          animation="launch.pulse"
          _motionReduce={{ animation: 'none' }}
          bg="launch.panel"
          color="launch.ink"
          width="fit-content"
          padding="launch.card"
          borderRadius="launch.card"
        >
          A little room to grow
        </Div>
      </Div>
    </Div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
