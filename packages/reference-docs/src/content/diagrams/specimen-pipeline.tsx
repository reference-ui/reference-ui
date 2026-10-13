import {
  BoltIcon,
  BrushIcon,
  CheckCircleIcon,
  CheckIcon,
  CodeIcon,
  DataObjectIcon,
  DesktopWindowsIcon,
  FingerprintIcon,
  FormatPaintIcon,
  LayersIcon,
  MemoryIcon,
  Package2Icon,
  PaletteIcon,
  ScanIcon,
  SchemaIcon,
  ShieldIcon,
  WidgetsIcon,
} from '@reference-ui/lib'
import { Div, Span, css } from '@reference-ui/react'
import { Diagram } from '../../components/diagram/Diagram'
import {
  actionButton,
  analysisTitle,
  bar,
  barOff,
  barOn,
  bars,
  brand,
  brandRange,
  brandTitle,
  canvasHead,
  cardHead,
  cardSub,
  cardTitle,
  checkBox,
  checkRow,
  checkText,
  chip,
  chips,
  codeBlock,
  dot,
  dotAmber,
  dotGreen,
  dotRed,
  dots,
  pillGreen,
  rule,
  skeleton,
  skeletonBar,
  spacer,
  stageHead,
  stageNo,
  stageNoBlue,
  stageNoGreen,
  stageTag,
  stageTitle,
  tagPillBlue,
  textAmber,
  textBlue,
  textDefault,
  textGreen,
  trayNeutral,
  windowChip,
  windowRow,
} from './specimen-pipeline.styles'

/**
 * The Reference UI pipeline end to end: authoring, the compiler, the generated
 * output, the build boundary, the browser runtime, the result. Every stage is a
 * panel, every handoff an arrow, every surface an ordinary Div inside a panel.
 * Tone marks the stages — blue builds, green generates and confirms, amber
 * fences. Everything inside a stage is neutral: cards, chips and pills sit on
 * the inset surface, so tints never sit on tints.
 */

const ink = css({ color: 'diagramMuted' })
const inkBlue = css({ color: 'diagramBlueText' })
const inkGreen = css({ color: 'diagramGreenText' })
const inkAmber = css({ color: 'diagramAmberText' })

const BAR_COUNT = 13
const BAR_ON = 8

export function ReferencePipeline() {
  return (
    <Diagram>
      <Div className={canvasHead}>
        <Div className={brand}>
          <SchemaIcon size="md" className={ink} />
          <Span className={brandTitle}>Reference UI pipeline</Span>
        </Div>
        <Span className={brandRange}>01 — 05</Span>
      </Div>

      <Div className={rule} />

      <Diagram.Column>
        {/* 01 — Authoring surface */}
        <Diagram.Panel>
          <Div className={stageHead}>
            <Span className={stageNo}>01</Span>
            <Span className={stageTitle}>Authoring surface</Span>
            <Div className={spacer} />
            <Span className={stageTag}>Developer input</Span>
          </Div>
          <Diagram.Row>
            <Diagram.Panel>
              <Div className={cardHead}>
                <CodeIcon size="md" className={ink} />
                <Span className={`${cardTitle} ${textDefault}`}>Component source</Span>
              </Div>
              <Div className={`${codeBlock} ${trayNeutral}`}>{'<Div\n  color="gray.100"\n  p="4"\n/>'}</Div>
              <Span className={cardSub}>React and style props</Span>
            </Diagram.Panel>
            <Diagram.Panel>
              <Div className={cardHead}>
                <DataObjectIcon size="md" className={ink} />
                <Span className={`${cardTitle} ${textDefault}`}>Style definitions</Span>
              </Div>
              <Div className={`${codeBlock} ${trayNeutral}`}>{'css()\nfont()\ntokens()'}</Div>
              <Span className={cardSub}>Recipes and tokens</Span>
            </Diagram.Panel>
          </Diagram.Row>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="ref sync" />

        {/* 02 — Compiler pipeline */}
        <Diagram.Panel tone="blue">
          <Div className={stageHead}>
            <Span className={stageNoBlue}>02</Span>
            <Span className={stageTitle}>Compiler pipeline</Span>
            <Div className={spacer} />
            <Span className={tagPillBlue}>Rust + Oxc</Span>
          </Div>

          <Diagram.Panel align="center">
            <Div className={cardHead}>
              <ScanIcon size="md" className={inkBlue} />
              <Span className={`${analysisTitle} ${textBlue}`}>Source analysis</Span>
            </Div>
            <Span className={cardSub}>Parse source, discover style usage and resolve dependencies</Span>
            <Div className={chips}>
              <Span className={`${chip} ${trayNeutral}`}>TSX</Span>
              <Span className={`${chip} ${trayNeutral}`}>AST</Span>
              <Span className={`${chip} ${trayNeutral}`}>Config</Span>
              <Span className={`${chip} ${trayNeutral}`}>Imports</Span>
            </Div>
          </Diagram.Panel>

          <Diagram.Arrow direction="down" />

          <Diagram.Row>
            <Diagram.Panel align="center">
              <PaletteIcon size="lg" className={inkBlue} />
              <Span className={`${cardTitle} ${textDefault}`}>Resolve tokens</Span>
              <Span className={cardSub}>Theme values</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <LayersIcon size="lg" className={inkBlue} />
              <Span className={`${cardTitle} ${textDefault}`}>Generate rules</Span>
              <Span className={cardSub}>Atomic CSS</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <FingerprintIcon size="lg" className={inkBlue} />
              <Span className={`${cardTitle} ${textDefault}`}>Deduplicate</Span>
              <Span className={cardSub}>Stable rules</Span>
            </Diagram.Panel>
          </Diagram.Row>

          <Diagram.Arrow direction="down" />

          <Diagram.Panel>
            <Div className={stageHead}>
              <MemoryIcon size="md" className={inkBlue} />
              <Span className={`${cardTitle} ${textBlue}`}>Canon CSS engine</Span>
              <Div className={spacer} />
              <Span className={tagPillBlue}>Build time</Span>
            </Div>
            <Span className={cardSub}>Emit compact, deterministic styling artifacts</Span>
            <Div className={bars}>
              {Array.from({ length: BAR_COUNT }, (_, i) => (
                <Div key={i} className={`${bar} ${i < BAR_ON ? barOn : barOff}`} />
              ))}
            </Div>
          </Diagram.Panel>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="Artifact generation" />

        {/* 03 — Generated output */}
        <Diagram.Panel tone="green">
          <Div className={stageHead}>
            <Span className={stageNoGreen}>03</Span>
            <Span className={stageTitle}>Generated output</Span>
            <Div className={spacer} />
            <Span className={stageTag}>Build artifacts</Span>
          </Div>
          <Diagram.Row>
            <Diagram.Panel>
              <Div className={cardHead}>
                <FormatPaintIcon size="md" className={inkGreen} />
                <Span className={`${cardTitle} ${textGreen}`}>Atomic stylesheet</Span>
              </Div>
              <Div className={`${codeBlock} ${trayNeutral}`}>{'.a1{padding:16px}\n.b2{color:#f3f4f6}'}</Div>
              <Span className={pillGreen}>Static CSS</Span>
            </Diagram.Panel>
            <Diagram.Panel>
              <Div className={cardHead}>
                <Package2Icon size="md" className={inkGreen} />
                <Span className={`${cardTitle} ${textGreen}`}>Component integration</Span>
              </Div>
              <Div className={`${checkBox} ${trayNeutral}`}>
                <Div className={checkRow}>
                  <CheckIcon size="sm" className={inkGreen} />
                  <Span className={checkText}>Resolved imports</Span>
                </Div>
                <Div className={checkRow}>
                  <CheckIcon size="sm" className={inkGreen} />
                  <Span className={checkText}>Style references</Span>
                </Div>
              </Div>
              <Span className={pillGreen}>Ready to bundle</Span>
            </Diagram.Panel>
          </Diagram.Row>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="Build / runtime boundary" />

        <Diagram.Panel tone="amber" variant="outline" align="center">
          <ShieldIcon size="lg" className={inkAmber} />
          <Span className={`${analysisTitle} ${textAmber}`}>Compilation boundary</Span>
          <Span className={cardSub}>
            Compiled styling ships as static output. The browser never repeats the work.
          </Span>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" />

        {/* 04 — Browser runtime */}
        <Diagram.Panel>
          <Div className={stageHead}>
            <Span className={stageNo}>04</Span>
            <Span className={stageTitle}>Browser runtime</Span>
            <Div className={spacer} />
            <Span className={stageTag}>User device</Span>
          </Div>

          <Diagram.Panel>
            <Div className={cardHead}>
              <DesktopWindowsIcon size="md" className={ink} />
              <Span className={`${cardTitle} ${textDefault}`}>Application rendering</Span>
            </Div>
            <Diagram.Row gap="tight">
              <Diagram.Panel align="center">
                <WidgetsIcon size="lg" className={ink} />
                <Span className={`${cardTitle} ${textDefault}`}>React</Span>
                <Span className={cardSub}>Element structure and interactions</Span>
              </Diagram.Panel>
              <Diagram.Panel align="center">
                <BrushIcon size="lg" className={ink} />
                <Span className={`${cardTitle} ${textDefault}`}>Browser CSS</Span>
                <Span className={cardSub}>Cascade, layout and painting</Span>
              </Diagram.Panel>
            </Diagram.Row>
          </Diagram.Panel>

          <Diagram.Panel>
            <Div className={stageHead}>
              <MemoryIcon size="md" className={ink} />
              <Span className={`${cardTitle} ${textDefault}`}>Rendered interface</Span>
              <Div className={spacer} />
              <Div className={dots}>
                <Div className={`${dot} ${dotRed}`} />
                <Div className={`${dot} ${dotAmber}`} />
                <Div className={`${dot} ${dotGreen}`} />
              </Div>
            </Div>
            <Div className={windowRow}>
              <Div className={windowChip}>
                <Package2Icon size="sm" className={ink} />
              </Div>
              <Div className={skeleton}>
                <Div className={skeletonBar} />
                <Div className={skeletonBar} />
              </Div>
              <Span className={actionButton}>Action</Span>
            </Div>
          </Diagram.Panel>
        </Diagram.Panel>

        <Diagram.Arrow direction="down" label="Deploy" />

        {/* 05 — Result */}
        <Diagram.Panel tone="green">
          <Div className={stageHead}>
            <Span className={stageNoGreen}>05</Span>
            <Span className={stageTitle}>Result</Span>
            <Div className={spacer} />
            <CheckCircleIcon size="md" className={inkGreen} />
          </Div>
          <Diagram.Row>
            <Diagram.Panel align="center">
              <BoltIcon size="lg" className={inkGreen} />
              <Span className={`${cardTitle} ${textGreen}`}>Precompiled</Span>
              <Span className={cardSub}>Styling</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <Package2Icon size="lg" className={inkGreen} />
              <Span className={`${cardTitle} ${textGreen}`}>Compact</Span>
              <Span className={cardSub}>Output</Span>
            </Diagram.Panel>
            <Diagram.Panel align="center">
              <FormatPaintIcon size="lg" className={inkGreen} />
              <Span className={`${cardTitle} ${textGreen}`}>Native</Span>
              <Span className={cardSub}>Rendering</Span>
            </Diagram.Panel>
          </Diagram.Row>
        </Diagram.Panel>
      </Diagram.Column>
    </Diagram>
  )
}
