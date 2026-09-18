// Entry for the PARITY-01 mini-lib world. It takes the generated primitives
// plus css()/recipe() and emits the six lib-shaped components (button, field
// bezel, file, disclosure, table, link) together with every live W4 probe
// node: the sibling, radius, style-var, height-recipe, named-container,
// attr-hover, breadth, first-child, dark-mix, and vendor probes, plus the
// F1 slash input. A second root renders the dark island as a body child.
// Every style object is literal; P5/P14/P15 stay out (RS-15/22/23).
import {
  A,
  Button,
  Details,
  Div,
  Input,
  Li,
  Q,
  Span,
  Summary,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Ul,
  createRoot,
  css,
  recipe,
} from '@reference-ui/react'

const sibling = css({ '& + &': { marginLeft: '8px' } })
const attrHover = css({ '&[data-state="open"]:hover': { color: 'brand' } })
const slashInvalid = css({ bg: 'red/abc' })
const darkMix = css({ backgroundColor: 'brand/40' })
const vendorOrient = css({ webkitBoxOrient: 'vertical' })
const containerWidth = css({ width: ['50px', '60px'] })
const negativeMargin = css({ marginTop: '-sm' })
const calcSize = css({ fontSize: '3.5r' })
const importantInk = css({ color: 'brand!' })
const tokenRadius = css({ borderRadius: 'lg' })
const rhythmRadius = css({ borderRadius: '1r' })
const animated = css({ animation: 'fade.quick' })
const namedRoot = css({ container: true })
const groupOnly = css({ color: 'ink', _groupHover: { color: 'brand' } })
const peerOnly = css({ color: 'ink', _peerFocus: { color: 'brand' } })
const motionOnly = css({ animation: 'fade.quick', _motionReduce: { animation: 'none' } })
const schemeOnly = css({ color: 'ink', _osDark: { color: 'brand' } })
const paperOnly = css({ display: 'block', _print: { display: 'none' } })

const card = recipe({
  className: 'card',
  base: { padding: 'md', backgroundColor: 'ui.panel', color: 'ink' },
  variants: {
    elevated: {
      true: { borderWidth: '1px', borderStyle: 'solid', borderColor: 'ink' },
      false: { borderWidth: '0' },
    },
  },
  defaultVariants: { elevated: 'false' },
})
const cardRaised = card({ elevated: true })
const cardFlat = card()

const chip = recipe({
  className: 'chip',
  base: { color: 'paper' },
  variants: {
    tone: {
      loud: { backgroundColor: 'brand', _hover: { backgroundColor: 'ink' } },
      quiet: { backgroundColor: 'accent' },
    },
    size: {
      sm: { padding: 'sm' },
      lg: { padding: 'lg' },
    },
  },
  defaultVariants: { tone: 'quiet', size: 'sm' },
  compoundVariants: [{ tone: 'loud', size: 'lg', css: { color: 'paper' } }],
})
const chipCombo = chip({ tone: 'loud', size: 'lg' })
const chipPlain = chip({ tone: 'quiet', size: 'sm' })

const heightCard = recipe({
  className: 'vh',
  base: {
    paddingTop: '0px',
    backgroundColor: 'transparent',
    '@media (min-height: 700px)': {
      paddingTop: '16px',
      backgroundColor: 'accent',
      color: 'paper',
    },
  },
})
const heightCls = heightCard()

const nestedItem = recipe({
  className: 'item',
  base: { color: 'ink' },
  variants: {
    size: {
      sm: { padding: '4px', '&:first-child': { padding: '8px' } },
      lg: { padding: '12px', '&:first-child': { padding: '16px' } },
    },
  },
  defaultVariants: { size: 'sm' },
})
const nestedCls = nestedItem({ size: { base: 'sm', md: 'lg' } })

export function SiteButtons() {
  return (
    <>
      <Button id="comp-button" variant="primary" data-testid="comp-button">
        <Span data-slot="icon">*</Span>primary
      </Button>
      <Button id="comp-button-base">base</Button>
      <Div id="comp-field" data-reference-field="true">
        <Input
          id="comp-field-input"
          data-slot="control"
          color="ink"
          placeholder="name"
          aria-label="name"
        />
      </Div>
      <Div>
        <Input id="comp-file" type="file" className="ref-file" color="ink" aria-label="upload" />
        <Input id="probe-range" type="range" className="ref-range" aria-label="level" />
      </Div>
    </>
  )
}

export function SiteDisclosure() {
  return (
    <>
      <Details id="comp-disc" className="ref-disclosure">
        <Summary id="comp-disc-summary">details</Summary>
        <Div>body</Div>
      </Details>
      <Table id="comp-table" className="ref-table">
        <Thead>
          <Tr>
            <Th id="comp-table-head">head</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td id="comp-table-cell" color="ink">
              cell
            </Td>
          </Tr>
        </Tbody>
      </Table>
      <A id="comp-link" className="ref-link" href="#comp-link" css={{ _hover: { color: 'ink' } }}>
        link
      </A>
      <Q id="comp-quote" className="ref-q">
        quoted
      </Q>
      <Ul id="comp-list" className="ref-list">
        <Li>one</Li>
      </Ul>
    </>
  )
}

export function SiteRecipes() {
  return (
    <>
      <Div id="recipe-card-raised" className={cardRaised}>
        raised
      </Div>
      <Div id="recipe-card-flat" className={cardFlat}>
        flat
      </Div>
      <Div id="recipe-chip-combo" className={chipCombo}>
        combo
      </Div>
      <Div id="recipe-chip-plain" className={chipPlain}>
        plain
      </Div>
    </>
  )
}

export function SiteRegion() {
  return (
    <Div id="region" container="sidebar" style={{ width: '800px' }}>
      <Div id="p13-first" className={nestedCls}>
        first
      </Div>
      <Div id="p13-second" className={nestedCls}>
        second
      </Div>
      <Div id="f32" className={containerWidth}>
        wide
      </Div>
      <Div id="narrow" className={namedRoot} style={{ width: '400px' }}>
        <Div id="p13-narrow-first" className={nestedCls}>
          narrow
        </Div>
      </Div>
    </Div>
  )
}

export function SiteProbeLayout() {
  return (
    <>
      <Div id="p2-first" className={sibling}>
        one
      </Div>
      <Div id="p2-second" className={sibling}>
        two
      </Div>
      <div id="p6" style={{ width: 'var(--parity-gutter)' }}>
        gutter
      </div>
      <Div id="p9" className={heightCls}>
        height
      </Div>
      <Div id="p11-open" className={attrHover} data-state="open">
        open
      </Div>
      <Div id="p11-closed" className={attrHover} data-state="closed">
        closed
      </Div>
      <Div
        id="p12"
        display="flex"
        overflow="hidden"
        letterSpacing="-0.01em"
        fontSize="16px"
      >
        breadth
      </Div>
      <Div id="probe-font" font="sans" weight="bold">
        font
      </Div>
      <Div id="p17" className={darkMix}>
        mix
      </Div>
      <Div id="p18" className={vendorOrient}>
        orient
      </Div>
      <Div id="f1" className={slashInvalid}>
        slash
      </Div>
    </>
  )
}

export function SiteProbeTokens() {
  return (
    <>
      <Div id="probe-negative" className={negativeMargin}>
        negative
      </Div>
      <Div id="probe-calc" className={calcSize}>
        calc
      </Div>
      <Div id="probe-bang" className={importantInk} px="sm">
        bang
      </Div>
      <Div id="probe-group" className={groupOnly}>
        group
      </Div>
      <Div id="probe-peer" className={peerOnly}>
        peer
      </Div>
      <Div id="probe-motion" className={motionOnly}>
        motion
      </Div>
      <Div id="probe-scheme" className={schemeOnly}>
        scheme
      </Div>
      <Div id="probe-paper" className={paperOnly}>
        paper
      </Div>
      <Div id="probe-radius-token" className={tokenRadius}>
        token radius
      </Div>
      <Div id="probe-radius-rhythm" className={rhythmRadius}>
        rhythm radius
      </Div>
      <Div id="probe-anim" className={animated}>
        anim
      </Div>
      <Div id="dark-override" color="ink" css={{ _dark: { color: 'accent' } }}>
        override
      </Div>
    </>
  )
}

export function Library() {
  return (
    <>
      <SiteButtons />
      <SiteDisclosure />
      <SiteRecipes />
      <SiteRegion />
      <SiteProbeLayout />
      <SiteProbeTokens />
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Library />)

const portalHost = document.createElement('div')
portalHost.id = 'parity-portal'
document.body.appendChild(portalHost)
createRoot(portalHost).render(
  <Div id="p1" colorMode="dark" color="ink">
    island
  </Div>,
)
