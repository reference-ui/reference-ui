// Previous/next article pager under the article.
// It takes nothing and emits the neighbors from the flattened doc order, keeping reading
// flowing across sections without a table of contents.
import { Link, useRouterState } from '@tanstack/react-router'
import { Div, Span, css } from '@reference-ui/react'
import { ArrowBackIcon, ArrowForwardIcon } from '@reference-ui/lib'
import { docs } from '../collections/runtime'

/**
 * Previous / next pager under the article, derived from the flattened doc
 * order. Keeps reading flowing across sections without a table of contents.
 */
const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1r',
  flex: '1 1 14rem',
  minWidth: '0',
  padding: '4r',
  borderRadius: 'md',
  textDecoration: 'none',
  color: 'docsText',
  transition: 'background 0.15s ease, color 0.15s ease',
  _hover: {
    background: 'docsPanelBg',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'docsRing',
    outlineOffset: '2px',
  },
  '&:hover [data-pager-arrow="next"]': { color: 'docsText', transform: 'translateX(2px)' },
  '&:hover [data-pager-arrow="prev"]': { color: 'docsText', transform: 'translateX(-2px)' },
})

const arrow = css({
  display: 'inline-flex',
  color: 'docsMuted',
  transition: 'color 0.15s ease, transform 0.15s ease',
})

const eyebrow = css({
  fontSize: '0.6875rem',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'docsNavHeading',
})

const title = css({
  fontSize: '0.9375rem',
  fontWeight: '600',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

type DocLink = { slug: string; title: string }

function PagerCard({ direction, doc }: { direction: 'prev' | 'next'; doc: DocLink }) {
  const isPrev = direction === 'prev'
  const body = (
    <>
      <Span className={eyebrow} textAlign={isPrev ? 'left' : 'right'}>
        {isPrev ? 'Previous' : 'Next'}
      </Span>
      <Span
        display="inline-flex"
        alignItems="center"
        gap="2r"
        justifyContent={isPrev ? 'flex-start' : 'flex-end'}
        className={title}
      >
        {isPrev ? (
          <span data-pager-arrow="prev" className={arrow}>
            <ArrowBackIcon size="sm" />
          </span>
        ) : null}
        {doc.title}
        {isPrev ? null : (
          <span data-pager-arrow="next" className={arrow}>
            <ArrowForwardIcon size="sm" />
          </span>
        )}
      </Span>
    </>
  )

  return doc.slug === 'initialize' ? (
    <Link to="/" className={card}>
      {body}
    </Link>
  ) : (
    <Link to="/$slug" params={{ slug: doc.slug }} className={card}>
      {body}
    </Link>
  )
}

function PagerSlot({ doc, direction }: { doc?: DocLink; direction: 'prev' | 'next' }) {
  if (doc) return <PagerCard direction={direction} doc={doc} />
  return <Div flex="1 1 14rem" />
}

export function DocPageNav() {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const slug = pathname === '/' ? 'initialize' : pathname.replace(/^\//, '')
  const index = docs.findIndex(doc => doc.slug === slug)
  if (index === -1) return null

  const prev = docs[index - 1]
  const next = docs[index + 1]
  if (!prev && !next) return null

  return (
    <Div
      display="flex"
      gap="4r"
      flexWrap="wrap"
      marginTop="14r"
      paddingTop="8r"
      borderTop="1px solid"
      borderTopColor="docsBorder"
    >
      <PagerSlot doc={prev} direction="prev" />
      <PagerSlot doc={next} direction="next" />
    </Div>
  )
}
