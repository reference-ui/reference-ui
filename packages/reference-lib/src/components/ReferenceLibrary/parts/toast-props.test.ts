import { describe, expect, it } from 'vitest'
import { DEFAULT_TOAST_HOTKEY } from '../../Toast/toastQueue'
import { resolveToastHostProps } from './toast-props'

describe('toaster prop mapping', () => {
  it('falls back to the global hotkey when toaster config is omitted', () => {
    expect(resolveToastHostProps(undefined).hotkey).toBe(DEFAULT_TOAST_HOTKEY)
  })

  it('falls back to the global hotkey when only the hotkey is omitted', () => {
    const props = resolveToastHostProps({ limit: 2 })
    expect(props.hotkey).toBe(DEFAULT_TOAST_HOTKEY)
    expect(props.limit).toBe(2)
  })

  it('preserves an explicit false hotkey instead of defaulting', () => {
    expect(resolveToastHostProps({ hotkey: false }).hotkey).toBe(false)
  })

  it('passes configured defaults through untouched', () => {
    const props = resolveToastHostProps({
      defaultPosition: 'top-start',
      defaultDuration: 7000,
      limit: 2,
      expand: true,
      richColors: true,
    })
    expect(props.defaultPosition).toBe('top-start')
    expect(props.defaultDuration).toBe(7000)
    expect(props.limit).toBe(2)
    expect(props.expand).toBe(true)
    expect(props.richColors).toBe(true)
  })

  it('preserves falsey defaults rather than coercing them', () => {
    const props = resolveToastHostProps({ defaultDuration: false, closeButton: false })
    expect(props.defaultDuration).toBe(false)
    expect(props.closeButton).toBe(false)
  })
})
