// Page and section headings for MDX articles.
// They take heading children and emit the title-plus-lead page header, anchored h2/h3
// sections, and numbered tutorial Steps. Ids and outline entries derive from heading text.
import { isValidElement, type JSX, type ReactNode } from 'react'
import { Div, H1, H2, H3, H4, P, css } from '@reference-ui/react'
import { useDocMeta } from '../shared/providers/DocMetaContext'
import { slugify } from './slug'

/**
 * MDX headings. The page title takes the frontmatter `description` as a muted
 * one-line lead under it. Section (`##`) and step (`###`) headings get slug ids
 * for the outline and a hover `#` anchor; `Step` adds a number badge. A `####`
 * label names a variant inside a step, such as "Primitive" or "css()". Their
 * spacing sets the page rhythm: heading, one line of explanation, then the
 * code panel.
 */

const headingAnchor = css({
  marginLeft: '2r',
  color: 'docsMuted',
  fontWeight: '400',
  textDecoration: 'none',
  opacity: '0',
  transition: 'opacity 0.15s ease, color 0.15s ease',
  _hover: { color: 'docsText' },
  _focusVisible: { outline: 'none', color: 'docsText' },
})

const headingHover = css({
  _hover: { '& > a': { opacity: '1' } },
  _focusWithin: { '& > a': { opacity: '1' } },
})

/** A first step straight under its section heading sits closer to it. */
const stepAfterSection = css({
  '&:is(h2 + *)': { marginTop: '6r' },
})

/** MDX native props minus legacy string-refs, which core primitives don't take. */
export type MdxProps<T extends keyof JSX.IntrinsicElements> = Omit<JSX.IntrinsicElements[T], 'ref'>

function toText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toText).join('')
  if (isValidElement(node)) return toText((node.props as { children?: ReactNode }).children)
  return ''
}

function Anchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      className={headingAnchor}
      aria-label="Link to this section"
      tabIndex={-1}
    >
      #
    </a>
  )
}

export function MdxH1(props: MdxProps<'h1'>) {
  const lead = useDocMeta()?.description
  const title = (
    <H1
      color="docsText"
      fontSize="9r"
      weight="sans.semibold"
      letterSpacing="-0.025em"
      lineHeight="1.15"
      marginTop="0"
      marginBottom={lead ? '3.5r' : '5r'}
      scrollMarginTop="20r"
      {...props}
    />
  )
  if (!lead) return title
  return (
    <Div marginBottom="10r">
      {title}
      <P color="docsMuted" fontSize="4.5r" lineHeight="1.45" margin="0">
        {lead}
      </P>
    </Div>
  )
}

export function MdxH2({ children, ...props }: MdxProps<'h2'>) {
  const id = slugify(toText(children))
  return (
    <H2
      id={id}
      className={headingHover}
      color="docsText"
      fontSize="6r"
      weight="sans.semibold"
      letterSpacing="-0.02em"
      lineHeight="1.25"
      marginTop="12r"
      marginBottom="5r"
      scrollMarginTop="20r"
      {...props}
    >
      {children}
      <Anchor id={id} />
    </H2>
  )
}

export function MdxH3(props: MdxProps<'h3'>) {
  return <SubHeading {...props} />
}

const stepBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
  width: '6.5r',
  height: '6.5r',
  borderRadius: 'sm',
  bg: 'docsActiveBg',
  color: 'docsText',
  fontSize: '0.8125rem',
  weight: 'sans.semibold',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0',
})

const stepRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3r',
})

/**
 * A numbered tutorial step: `<Step n={1}>Install the packages</Step>`. The
 * number is a badge beside the heading; the id, anchor and outline entry use
 * the heading text alone.
 */
export function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <SubHeading className={stepRow} badge={n}>
      {children}
    </SubHeading>
  )
}

/** A `####` label over one code panel: plain text, no anchor or outline entry. */
export function MdxH4(props: MdxProps<'h4'>) {
  return (
    <H4
      color="docsText"
      fontSize="4r"
      weight="sans.semibold"
      lineHeight="1.4"
      marginTop="6r"
      marginBottom="2r"
      {...props}
    />
  )
}

type SubHeadingProps = MdxProps<'h3'> & { badge?: number }

function SubHeading({ children, className, badge, id: givenId, ...props }: SubHeadingProps) {
  const text = toText(children)
  // rehypeSectionIds sets an id only when the plain slug repeats on the page.
  const id = givenId ?? slugify(text)
  return (
    <H3
      id={id}
      data-toc-label={badge === undefined ? undefined : text}
      className={[headingHover, stepAfterSection, className].filter(Boolean).join(' ')}
      color="docsText"
      fontSize="4.5r"
      weight="sans.semibold"
      letterSpacing="-0.01em"
      lineHeight="1.35"
      marginTop="10r"
      marginBottom="2r"
      scrollMarginTop="20r"
      {...props}
    >
      {badge === undefined ? null : (
        <span className={stepBadge} aria-hidden="true">
          {badge}
        </span>
      )}
      {badge === undefined ? children : <span>{children}</span>}
      <Anchor id={id} />
    </H3>
  )
}
