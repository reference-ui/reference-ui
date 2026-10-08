import { Div, Header, Span, css } from '@reference-ui/react'
import { MenuIcon } from '@reference-ui/lib'
import { Brand } from './Brand'
import { IconButton } from './IconButton'
import { ThemeToggle } from './ThemeToggle'
import { controlSurface } from './controlSurface'
import { GithubIcon } from './icons'

/**
 * Floating header. No bar and no fill of its own — it hovers over the article,
 * top-right on desktop, with each control carrying its own frosted surface so
 * it stays legible when content scrolls beneath. On small viewports it also
 * holds the drawer trigger and wordmark.
 */
const repoLink = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2r',
  height: '9r',
  paddingX: '3r',
  borderRadius: 'md',
  textDecoration: 'none',
  fontSize: '0.875rem',
})

export function DocHeader({ onOpenNav }: { onOpenNav: () => void }) {
  return (
    <Header
      position="absolute"
      top="4r"
      left="4r"
      right="4r"
      zIndex="30"
      display="flex"
      alignItems="center"
      pointerEvents="none"
      r={{ 768: { top: '5r', left: 'auto', right: '6r' } }}
    >
      <Div
        className={controlSurface}
        display="flex"
        alignItems="center"
        gap="1r"
        paddingRight="3r"
        borderRadius="md"
        pointerEvents="auto"
        r={{ 768: { display: 'none' } }}
      >
        <IconButton label="Open navigation" onClick={onOpenNav}>
          <MenuIcon />
        </IconButton>
        <Brand />
      </Div>

      <Div flex="1" />

      <Div display="flex" alignItems="center" gap="2r" pointerEvents="auto">
        <a
          href="https://github.com/reference-ui/reference-ui"
          target="_blank"
          rel="noreferrer"
          className={`${repoLink} ${controlSurface}`}
        >
          <GithubIcon />
          <Span display="none" r={{ 640: { display: 'inline' } }}>
            GitHub
          </Span>
        </a>
        <ThemeToggle />
      </Div>
    </Header>
  )
}
