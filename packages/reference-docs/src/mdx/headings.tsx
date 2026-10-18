import { isValidElement, type JSX, type ReactNode } from 'react'
import { Div, H1, H2, H3, P, css } from '@reference-ui/react'
import { useDocMeta } from '../shared/providers/DocMetaContext'

/**
 * MDX headings. The page title takes the frontmatter `description` as a muted
 * one-line lead under it. Section (`##`) and step (`###`) headings get slug ids
 * for the outline and a hover `#` anchor; their spacing sets the page rhythm:
 * heading, one line of explanation, then the code panel.
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

/** MDX native props minus legacy string-refs, which neo primitives don't take. */
export type MdxProps<T extends keyof JSX.IntrinsicElements> = Omit<JSX.IntrinsicElements[T], 'ref'>

function toText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toText).join('')
  if (isValidElement(node)) return toText((node.props as { children?: ReactNode }).children)
  return ''
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
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
      fontWeight="600"
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
      fontWeight="600"
      letterSpacing="-0.02em"
      lineHeight="1.25"
      marginTop="12r"
      marginBottom="3r"
      scrollMarginTop="20r"
      {...props}
    >
      {children}
      <Anchor id={id} />
    </H2>
  )
}

export function MdxH3({ children, ...props }: MdxProps<'h3'>) {
  const id = slugify(toText(children))
  return (
    <H3
      id={id}
      className={`${headingHover} ${stepAfterSection}`}
      color="docsText"
      fontSize="4.5r"
      fontWeight="600"
      letterSpacing="-0.01em"
      lineHeight="1.35"
      marginTop="10r"
      marginBottom="2r"
      scrollMarginTop="20r"
      {...props}
    >
      {children}
      <Anchor id={id} />
    </H3>
  )
}
