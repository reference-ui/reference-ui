import * as React from 'react'
import { Div } from '@reference-ui/react'
import type {
  MaterialSymbolIconComponent,
  MaterialSymbolIconProps,
  MaterialSymbolIconShellProps,
  IconSizeValue,
} from './types'

const IconShell = Div as unknown as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MaterialSymbolIconShellProps> & React.RefAttributes<HTMLDivElement>
>

export const ICON_SIZE_TOKENS: Record<string, string> = {
  small: 'var(--spacing-4r, 16px)',
  sm: 'var(--spacing-4r, 16px)',
  base: 'var(--spacing-5r, 20px)',
  md: 'var(--spacing-5r, 20px)',
  large: 'var(--spacing-6r, 24px)',
  lg: 'var(--spacing-6r, 24px)',
}

function formatIconSize(val: IconSizeValue | undefined): string {
  if (val === undefined || val === null) return ICON_SIZE_TOKENS.base
  if (typeof val === 'string' && val in ICON_SIZE_TOKENS) {
    return ICON_SIZE_TOKENS[val]
  }
  if (typeof val === 'number') return `${val}px`
  if (typeof val === 'string' && /^-?\d+(\.\d+)?r$/.test(val)) {
    const num = parseFloat(val)
    return `calc(${num} * var(--spacing-root, 4px))`
  }
  return String(val)
}

export function createIcon(
  Outline: React.ElementType,
  Filled: React.ElementType,
  displayName: string,
): MaterialSymbolIconComponent {
  const Icon = React.forwardRef<HTMLDivElement, MaterialSymbolIconProps>(function MaterialIcon(
    { variant = 'outline', size, style, color = 'inherit', ...rest },
    ref,
  ) {
    const Svg = (variant === 'filled' ? Filled : Outline) as React.ComponentType<
      Record<string, unknown>
    >
    const resolvedSize = formatIconSize(size)

    return (
      <IconShell
        ref={ref}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        lineHeight="0"
        flexShrink="0"
        color={color}
        style={{
          width: resolvedSize,
          height: resolvedSize,
          minWidth: resolvedSize,
          minHeight: resolvedSize,
          ...style,
        }}
        {...rest}
      >
        <Svg
          width="100%"
          height="100%"
          fill="currentColor"
          color="currentColor"
          aria-hidden="true"
          focusable="false"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </IconShell>
    )
  })
  Icon.displayName = displayName
  return Icon
}
