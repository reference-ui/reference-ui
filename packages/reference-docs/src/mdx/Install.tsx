import { useRef, useSyncExternalStore, type KeyboardEvent } from 'react'
import { Div, css } from '@reference-ui/react'
import { CopyButton, panelCode, panelFrame, panelSurface } from './codePanel'

/**
 * Package-manager install block for MDX: npm / yarn / pnpm / bun tabs over the
 * install command. Every block on the page shares one choice, and the choice
 * is remembered across visits.
 *
 *   <Install packages="@reference-ui/lib react react-dom" />
 *   <Install packages="@reference-ui/core" dev />
 *   <Install packages="@reference-ui/lib" devPackages="@reference-ui/core" />
 */

const MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const
type Manager = (typeof MANAGERS)[number]

const COMMANDS: Record<Manager, { add: string; dev: string }> = {
  npm: { add: 'npm install', dev: 'npm install --save-dev' },
  yarn: { add: 'yarn add', dev: 'yarn add -D' },
  pnpm: { add: 'pnpm add', dev: 'pnpm add -D' },
  bun: { add: 'bun add', dev: 'bun add -D' },
}

// One choice per page, shared by every block through a tiny external store.
const STORAGE_KEY = 'reference-docs-package-manager'
const listeners = new Set<() => void>()
let current: Manager = readStored()

function isManager(value: unknown): value is Manager {
  return MANAGERS.includes(value as Manager)
}

function readStored(): Manager {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isManager(stored) ? stored : 'npm'
  } catch {
    return 'npm'
  }
}

function choose(manager: Manager) {
  current = manager
  try {
    window.localStorage.setItem(STORAGE_KEY, manager)
  } catch {
    // Storage blocked (private mode): the choice still holds for this page.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function usePackageManager(): Manager {
  return useSyncExternalStore(subscribe, () => current, () => 'npm')
}

const tabList = css({
  display: 'flex',
  gap: '1r',
  paddingX: '2r',
  borderBottom: '1px solid',
  borderBottomColor: 'docsBorder',
})

const tab = css({
  position: 'relative',
  height: '10r',
  paddingX: '2r',
  border: 'none',
  bg: 'transparent',
  color: 'docsMuted',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'color 0.15s ease',
  _hover: { color: 'docsText' },
  _focusVisible: { outline: '2px solid', outlineColor: 'docsRing', outlineOffset: '-4px' },
  '&[aria-selected="true"]': {
    color: 'docsText',
    fontWeight: '500',
    _after: {
      content: '""',
      position: 'absolute',
      left: '2r',
      right: '2r',
      bottom: '-1px',
      height: '2px',
      bg: 'docsAccent',
    },
  },
})

const command = css({ color: 'docsAccent' })

// Centres the 28px copy button in the 40px tab row, where it stays visible.
const TAB_ROW_COPY = { top: '0.375rem', opacity: 1 }

type InstallProps = {
  /** Space-separated package names. */
  packages: string
  /** Install `packages` as dev dependencies. */
  dev?: boolean
  /** A second line that installs these as dev dependencies. */
  devPackages?: string
}

export function Install({ packages, dev = false, devPackages }: InstallProps) {
  const manager = usePackageManager()
  const codeRef = useRef<HTMLElement>(null)
  const lines = [{ verb: dev ? 'dev' : 'add', names: packages }] as const
  const allLines = devPackages
    ? [...lines, { verb: 'dev', names: devPackages } as const]
    : lines

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    const next = MANAGERS[(MANAGERS.indexOf(manager) + step + MANAGERS.length) % MANAGERS.length]
    choose(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-manager="${next}"]`)?.focus()
  }

  return (
    <Div className={panelFrame}>
      <Div className={panelSurface}>
        <Div role="tablist" aria-label="Package manager" className={tabList} onKeyDown={onKeyDown}>
          {MANAGERS.map(name => (
            <button
              key={name}
              type="button"
              role="tab"
              data-manager={name}
              aria-selected={name === manager}
              tabIndex={name === manager ? 0 : -1}
              className={tab}
              onClick={() => choose(name)}
            >
              {name}
            </button>
          ))}
        </Div>
        {/* In the tab row, so it never covers a long command on a narrow screen. */}
        <CopyButton getText={() => codeRef.current?.innerText} style={TAB_ROW_COPY} />
        <Div role="tabpanel" aria-label={manager}>
          <pre className={panelCode}>
            <code ref={codeRef}>
              {allLines.map(line => (
                <span key={line.verb + line.names} data-line="">
                  <span className={command}>{COMMANDS[manager][line.verb]}</span> {line.names}
                </span>
              ))}
            </code>
          </pre>
        </Div>
      </Div>
    </Div>
  )
}
