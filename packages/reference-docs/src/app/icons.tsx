import type { ReactNode } from 'react'
import { Svg } from '@reference-ui/react'

/**
 * Shell icons. Small inline SVGs that inherit `currentColor` so callers control
 * their tone through StyleProps. No icon package is needed for this handful.
 */

const base = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Glyph({ children }: { children: ReactNode }) {
  return <Svg {...base}>{children}</Svg>
}

export function MenuIcon() {
  return (
    <Glyph>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Glyph>
  )
}

export function CloseIcon() {
  return (
    <Glyph>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  )
}

export function SunIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Glyph>
  )
}

export function MoonIcon() {
  return (
    <Glyph>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Glyph>
  )
}

export function GithubIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </Svg>
  )
}

export function ArrowRightIcon() {
  return (
    <Glyph>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Glyph>
  )
}

export function ArrowLeftIcon() {
  return (
    <Glyph>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Glyph>
  )
}
