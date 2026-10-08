import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Aside, Div, css } from '@reference-ui/react'

/**
 * Right-hand "On this page" rail. Headings are read back out of the rendered
 * article (they already carry ids from the MDX mapping), so there is no second
 * source of truth for the outline. A scroll listener tracks the active section.
 */

type TocItem = { id: string; text: string; level: 'h2' | 'h3' }

const label = css({
  fontSize: '0.6875rem',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'docsNavHeading',
  marginBottom: '3r',
})

const linkBase = css({
  display: 'block',
  paddingY: '1.25r',
  fontSize: '0.8125rem',
  lineHeight: '1.45',
  textDecoration: 'none',
  transition: 'color 0.15s ease',
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'docsRing',
    outlineOffset: '2px',
    borderRadius: 'sm',
  },
})

const linkIdle = css({
  color: 'docsMuted',
  _hover: { color: 'docsText' },
})

const linkActive = css({
  color: 'docsText',
  fontWeight: '500',
})

const indent = css({ paddingLeft: '3r' })

function readItems(root: Element): TocItem[] {
  return Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map(node => ({
    id: node.id,
    text: (node.textContent ?? '').replace(/#$/, '').trim(),
    level: node.tagName.toLowerCase() as 'h2' | 'h3',
  }))
}

export function DocToc() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const root = document.querySelector('[data-docs-content]')
    if (!root) return
    const next = readItems(root)
    setItems(next)
    if (next.length === 0) return

    const scroller = (root.closest('main') ?? document) as HTMLElement
    const onScroll = () => {
      let current = next[0].id
      for (const item of next) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 120) current = item.id
      }
      setActiveId(current)
    }
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  if (items.length === 0) return null

  return (
    <Aside
      aria-label="On this page"
      display="none"
      width="13rem"
      flexShrink="0"
      alignSelf="flex-start"
      position="sticky"
      top="16r"
      maxHeight="calc(100dvh - 12rem)"
      overflowY="auto"
      r={{ 1280: { display: 'block' } }}
    >
      <Div className={label}>On this page</Div>
      <Div display="flex" flexDirection="column">
        {items.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={[
              linkBase,
              item.level === 'h3' ? indent : '',
              activeId === item.id ? linkActive : linkIdle,
            ].join(' ')}
          >
            {item.text}
          </a>
        ))}
      </Div>
    </Aside>
  )
}
