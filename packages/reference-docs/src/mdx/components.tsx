import {
  isValidElement,
  type AnchorHTMLAttributes,
  type JSX,
  type ReactNode,
} from 'react'
import type { MDXComponents } from 'mdx/types'
import { Link } from '@tanstack/react-router'
import {
  A,
  Blockquote,
  Code,
  Div,
  H1,
  H2,
  H3,
  Hr,
  Li,
  Ol,
  P,
  Strong,
  Ul,
  css,
} from '@reference-ui/react'
import { CodeBlock } from './CodeBlock'

const linkClass = css({
  color: 'docsHighlight',
  textDecoration: 'underline',
  textDecorationColor: 'color-mix(in oklch, currentColor 35%, transparent)',
  textUnderlineOffset: '3px',
  transition: 'text-decoration-color 0.15s ease',
  _hover: {
    color: 'docsHighlight',
    textDecorationColor: 'currentColor',
  },
})

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

/** MDX native props minus legacy string-refs, which neo primitives don't take. */
type MdxProps<T extends keyof JSX.IntrinsicElements> = Omit<JSX.IntrinsicElements[T], 'ref'>

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

function MdxLink({ href = '', children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href === '' || /^(https?:|mailto:)/.test(href)) {
    return (
      <A href={href} className={linkClass} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </A>
    )
  }
  if (href.startsWith('#')) {
    return (
      <a href={href} className={linkClass} {...rest}>
        {children}
      </a>
    )
  }
  const slug = href.replace(/^\//, '')
  if (slug === '') {
    return (
      <Link to="/" className={linkClass} {...rest}>
        {children}
      </Link>
    )
  }
  if (slug.includes('/')) {
    return (
      <a href={href} className={linkClass} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to="/$slug" params={{ slug }} className={linkClass} {...rest}>
      {children}
    </Link>
  )
}

const tableWrap = css({
  width: '100%',
  overflowX: 'auto',
  marginBottom: '6r',
})

const tableClass = css({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
  textAlign: 'left',
})

const thClass = css({
  paddingY: '3r',
  paddingX: '3r',
  fontWeight: '500',
  color: 'docsMuted',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid',
  borderBottomColor: 'docsBorder',
})

const tdClass = css({
  paddingY: '3r',
  paddingX: '3r',
  verticalAlign: 'top',
  borderBottom: '1px solid',
  borderBottomColor: 'docsBorder',
})

// Every mapping is a capitalised component so the object reads as a compound
// component to React Fast Refresh. Lowercase keys stay on the map; the values
// carry the component identity.
function MdxH1(props: MdxProps<'h1'>) {
  return (
    <H1
      color="docsText"
      fontSize="8r"
      letterSpacing="-0.025em"
      lineHeight="1.12"
      marginTop="0"
      marginBottom="5r"
      scrollMarginTop="20r"
      {...props}
    />
  )
}

function MdxH2({ children, ...props }: MdxProps<'h2'>) {
  const id = slugify(toText(children))
  return (
    <H2
      id={id}
      className={headingHover}
      color="docsText"
      fontSize="6r"
      letterSpacing="-0.02em"
      lineHeight="1.25"
      marginTop="12r"
      marginBottom="4r"
      scrollMarginTop="20r"
      {...props}
    >
      {children}
      <Anchor id={id} />
    </H2>
  )
}

function MdxH3({ children, ...props }: MdxProps<'h3'>) {
  const id = slugify(toText(children))
  return (
    <H3
      id={id}
      className={headingHover}
      color="docsText"
      fontSize="5r"
      letterSpacing="-0.01em"
      lineHeight="1.3"
      marginTop="8r"
      marginBottom="3r"
      scrollMarginTop="20r"
      {...props}
    >
      {children}
      <Anchor id={id} />
    </H3>
  )
}

function MdxP(props: MdxProps<'p'>) {
  return (
    <P
      color="docsText"
      fontSize="md"
      lineHeight="1.7"
      marginTop="0"
      marginBottom="4r"
      {...props}
    />
  )
}

function MdxUl(props: MdxProps<'ul'>) {
  return <Ul marginTop="0" marginBottom="4r" paddingLeft="5r" color="docsText" {...props} />
}

function MdxOl(props: MdxProps<'ol'>) {
  return <Ol marginTop="0" marginBottom="4r" paddingLeft="5r" color="docsText" {...props} />
}

function MdxLi(props: MdxProps<'li'>) {
  return <Li marginBottom="1r" lineHeight="1.6" {...props} />
}

function MdxStrong(props: MdxProps<'strong'>) {
  return <Strong color="docsText" fontWeight="700" {...props} />
}

function MdxHr(props: MdxProps<'hr'>) {
  return <Hr borderColor="docsBorder" marginY="10r" {...props} />
}

function MdxBlockquote(props: MdxProps<'blockquote'>) {
  return (
    <Blockquote
      borderLeft="4px solid"
      borderLeftColor="docsBlockquoteBorder"
      paddingLeft="4r"
      marginY="4r"
      color="docsMuted"
      fontStyle="italic"
      {...props}
    />
  )
}

function MdxTable({ children, ...rest }: MdxProps<'table'>) {
  return (
    <Div className={tableWrap}>
      <table className={tableClass} {...rest}>
        {children}
      </table>
    </Div>
  )
}

function MdxTh(props: MdxProps<'th'>) {
  return <th className={thClass} {...props} />
}

function MdxTd(props: MdxProps<'td'>) {
  return <td className={tdClass} {...props} />
}

function MdxCode({ className, children, ...rest }: MdxProps<'code'>) {
  const isBlock =
    (typeof className === 'string' && className.includes('language-')) ||
    'data-language' in rest
  if (isBlock) {
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    )
  }
  return (
    <Code
      fontSize="0.875em"
      fontFamily="mono"
      bg="docsInlineCodeBg"
      color="docsText"
      paddingX="1r"
      paddingY="0.5r"
      borderRadius="sm"
      className={className}
      {...rest}
    >
      {children}
    </Code>
  )
}

export const mdxComponents = {
  h1: MdxH1,
  h2: MdxH2,
  h3: MdxH3,
  p: MdxP,
  a: MdxLink,
  ul: MdxUl,
  ol: MdxOl,
  li: MdxLi,
  strong: MdxStrong,
  hr: MdxHr,
  blockquote: MdxBlockquote,
  table: MdxTable,
  th: MdxTh,
  td: MdxTd,
  code: MdxCode,
  pre: CodeBlock,
} satisfies MDXComponents
