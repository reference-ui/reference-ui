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

function formatIconSize(val: IconSizeValue | undefined): string {
  if (val === undefined || val === null) return 'var(--spacing-5r, 20px)'
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
