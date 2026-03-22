import type { AnchorHTMLAttributes } from 'react'
import type { MDXComponents } from 'mdx/types'
import { Link } from '@tanstack/react-router'
import {
  A,
  Blockquote,
  Code,
  H1,
  H2,
  H3,
  Hr,
  Li,
  Ol,
  P,
  Pre,
  Strong,
  Ul,
  css,
} from '@reference-ui/react'

const linkClass = css({
  color: 'docsAccent',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  _hover: { color: 'docsAccent' },
})

function MdxLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href || href.startsWith('http') || href.startsWith('mailto:')) {
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
  if (href === '/') {
    return (
      <Link to="/" className={linkClass} {...rest}>
        {children}
      </Link>
    )
  }
  const segment = href.replace(/^\//, '').split('/')[0]
  if (segment && !href.slice(1).includes('/')) {
    return (
      <Link to="/$slug" params={{ slug: segment }} className={linkClass} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <Link to={href} className={linkClass} {...rest}>
      {children}
    </Link>
  )
}

export const mdxComponents = {
  h1: props => (
    <H1
      color="docsText"
      fontSize="8r"
      fontWeight="700"
      letterSpacing="-0.02em"
      lineHeight="1.15"
      marginTop="0"
      marginBottom="4r"
      {...props}
    />
  ),
  h2: props => (
    <H2
      color="docsText"
      fontSize="6r"
      fontWeight="600"
      marginTop="8r"
      marginBottom="3r"
      paddingBottom="2r"
      borderBottom="1px solid"
      borderBottomColor="docsPanelBorder"
      {...props}
    />
  ),
  h3: props => (
    <H3 color="docsText" fontSize="5r" fontWeight="600" marginTop="6r" marginBottom="2r" {...props} />
  ),
  p: props => (
    <P color="docsText" fontSize="md" lineHeight="1.65" marginTop="0" marginBottom="4r" {...props} />
  ),
  a: MdxLink,
  ul: props => <Ul marginTop="0" marginBottom="4r" paddingLeft="5r" color="docsText" {...props} />,
  ol: props => <Ol marginTop="0" marginBottom="4r" paddingLeft="5r" color="docsText" {...props} />,
  li: props => <Li marginBottom="1r" lineHeight="1.6" {...props} />,
  strong: props => <Strong color="docsText" fontWeight="700" {...props} />,
  hr: props => <Hr borderColor="docsPanelBorder" marginY="8r" {...props} />,
  blockquote: props => (
    <Blockquote
      borderLeft="4px solid"
      borderLeftColor="docsBlockquoteBorder"
      paddingLeft="4r"
      marginY="4r"
      color="docsMuted"
      fontStyle="italic"
      {...props}
    />
  ),
  code: ({ className, children, ...rest }) => {
    const isBlock = typeof className === 'string' && className.includes('language-')
    if (isBlock) {
      return (
        <Code
          display="block"
          fontFamily="mono"
          fontSize="sm"
          whiteSpace="pre"
          color="inherit"
          className={className}
          {...rest}
        >
          {children}
        </Code>
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
  },
  pre: props => (
    <Pre
      overflow="auto"
      padding="4r"
      marginTop="0"
      marginBottom="4r"
      bg="docsPanelBg"
      color="docsText"
      border="1px solid"
      borderColor="docsPanelBorder"
      borderRadius="lg"
      fontSize="sm"
      lineHeight="1.5"
      {...props}
    />
  ),
} satisfies MDXComponents
