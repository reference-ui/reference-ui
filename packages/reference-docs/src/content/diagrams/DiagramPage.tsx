import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Div, H1, H2, Li, Ol, P, Span, Strong, css } from '@reference-ui/react'
import { ThemeToggle } from '../../app/ThemeToggle'
import { useDocsTheme } from '../../shared/providers/DocsThemeContext'
import { ApiExample } from './specimen-api'
import { ArrowGallery } from './specimen-arrows'
import { LicenseGallery } from './specimen-license'
import { ReferencePipeline } from './specimen-pipeline'
import { SyncOverview } from './specimen-sync'
import { ToneGallery } from './specimen-tones'

/**
 * Private diagram gallery at /diagram. Deliberately outside the doc shell —
 * no sidebar, no nav entry — so diagrams get full-bleed canvases. Agents
 * learn the aesthetic here: the specimens plus the guidelines below are the
 * whole teaching set.
 */

const backLink = css({
  fontSize: 'sm',
  color: 'docsMuted',
  textDecoration: 'none',
  _hover: { color: 'docsText' },
})

const eyebrow = css({
  fontSize: 'sm',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'docsMuted',
  lineHeight: '1.4',
})

function Section({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <Div display="flex" flexDirection="column" gap="4r">
      <Div display="flex" flexDirection="column" gap="2r">
        <H2 margin="0" color="docsText" fontSize="6r" letterSpacing="-0.02em" lineHeight="1.25">
          {title}
        </H2>
        <P margin="0" color="docsMuted" fontSize="md" lineHeight="1.7">
          {lede}
        </P>
      </Div>
      {children}
    </Div>
  )
}

export function DiagramPage() {
  const { colorMode } = useDocsTheme()
  return (
    <Div container colorMode={colorMode} bg="docsPageBg" color="docsText" minHeight="100dvh">
      <Div
        maxWidth="76rem"
        marginX="auto"
        paddingX="6r"
        paddingTop="8r"
        paddingBottom="16r"
        display="flex"
        flexDirection="column"
        gap="12r"
      >
        <Div display="flex" alignItems="center" justifyContent="space-between">
          <Link to="/" className={backLink}>
            ← Docs
          </Link>
          <ThemeToggle />
        </Div>

        <Div display="flex" flexDirection="column" gap="3r">
          <Span className={eyebrow}>Private gallery</Span>
          <H1
            margin="0"
            color="docsText"
            fontSize="8r"
            letterSpacing="-0.025em"
            lineHeight="1.12"
          >
            Diagram kit
          </H1>
          <P margin="0" color="docsMuted" fontSize="md" lineHeight="1.7" maxWidth="46rem">
            Five pieces — canvas, row, column, panel, arrow — composed with ordinary
            components. Nothing here ships in the sidebar; this page exists so diagrams
            across the docs share one hand.
          </P>
        </Div>

        <Section
          title="The whole API"
          lede="One canvas, one row, two panels, one arrow. Titles, icons, code, and the badge are plain components inside the panels."
        >
          <ApiExample />
        </Section>

        <Section
          title="Panel tones"
          lede="Six semantic tones across three intensities, plus the dashed outline variant. Tone says what a panel means; emphasis says how loudly — subtle is the default, so reach past it only when a panel earns it."
        >
          <ToneGallery />
        </Section>

        <Section
          title="Arrows"
          lede="Connections stay quiet and neutral; the label carries the verb. Down and right do nearly all the work."
        >
          <ArrowGallery />
        </Section>

        <Section
          title="Gallery · one workflow"
          lede="A command block drops into a grid of outcomes. Rows inside a column make the two-by-two with no grid primitive."
        >
          <SyncOverview />
        </Section>

        <Section
          title="Gallery · licence seats"
          lede="Green carries the activated state end to end; the limit note stays neutral. Panels nest layout freely."
        >
          <LicenseGallery />
        </Section>

        <Section
          title="Gallery · reference pipeline"
          lede="The whole pipeline: staged panels, icon headers, a nested analysis surface, the build-time canon engine, a browser-runtime mock, and the result strip. Tone carries meaning at the default intensity; panels nest, the canvas never does."
        >
          <ReferencePipeline />
        </Section>

        <Section
          title="Composition guidelines"
          lede="The rules of the hand. Examples above show each one in practice."
        >
          <Ol margin="0" paddingLeft="5r" color="docsText" display="flex" flexDirection="column" gap="2r">
            <Li lineHeight="1.7">
              <Strong fontWeight="600">One direction per diagram.</Strong> Down for processes,
              right for transforms. Never both in the same flow.
            </Li>
            <Li lineHeight="1.7">
              <Strong fontWeight="600">Panels hold content; arrows carry verbs.</Strong> If a
              connection needs explaining, label the arrow — do not add a panel.
            </Li>
            <Li lineHeight="1.7">
              <Strong fontWeight="600">Tones carry meaning.</Strong> Neutral structures, blue
              builds, green confirms, amber warns, red blocks, violet transforms.
            </Li>
            <Li lineHeight="1.7">
              <Strong fontWeight="600">Content is ordinary components.</Strong> Span, Code,
              icons, and small css() chips. No diagram-specific content components.
            </Li>
            <Li lineHeight="1.7">
              <Strong fontWeight="600">Nest rows, columns, and panels — never canvases.</Strong>{' '}
              One Diagram per figure; everything inside composes.
            </Li>
            <Li lineHeight="1.7">
              <Strong fontWeight="600">Keep labels short.</Strong> A command, a handoff, a
              boundary name. Wide rows scroll on narrow screens rather than wrapping.
            </Li>
          </Ol>
        </Section>

        <P margin="0" color="docsMuted" fontSize="sm" lineHeight="1.6">
          Private gallery — nothing here ships in the sidebar. The kit lives in
          src/content/diagrams.
        </P>
      </Div>
    </Div>
  )
}
