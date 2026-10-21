// MDX element mapping: docs visual system for rendered pages.
// It takes nothing and emits the provider component map (headings, lists, code, links) that
// turns MDX output into docs chrome. Links to another docs page go through the router with their
// #section hash kept; external and same-page links stay plain anchors. This is rendering policy,
// not generic shared UI.
import type { AnchorHTMLAttributes } from 'react'
import type { MDXComponents } from 'mdx/types'
import { Link } from '@tanstack/react-router'
import {
  A,
  Blockquote,
  Code,
  Div,
  Hr,
  Li,
  Ol,
  P,
  Strong,
  Ul,
  css,
} from '@reference-ui/react'
import { CodeBlock } from './CodeBlock'
import { CodeTabs } from './CodeTabs'
import { MdxH1, MdxH2, MdxH3, MdxH4, Step, type MdxProps } from './headings'
import { Install } from './Install'
import { InstallPrompt } from './InstallPrompt'
import { LinkCard, LinkCards } from './LinkCards'
import { splitLinkHash } from './linkHash'

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
  const { path, hash } = splitLinkHash(href)
  const slug = path.replace(/^\//, '')
  if (slug === '') {
    return (
      <Link to="/" hash={hash} className={linkClass} {...rest}>
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
    <Link to="/$slug" params={{ slug }} hash={hash} className={linkClass} {...rest}>
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
function MdxP(props: MdxProps<'p'>) {
  return (
    <P
      color="docsText"
      fontSize="4r"
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
  h4: MdxH4,
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
  CodeTabs,
  Install,
  InstallPrompt,
  LinkCard,
  LinkCards,
  Step,
} satisfies MDXComponents
