import * as React from 'react'

export type SplitterOrientation = 'horizontal' | 'vertical'

export interface SplitterProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange' | 'defaultValue'> {
  orientation?: SplitterOrientation
  value?: number[]
  defaultValue?: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
  disabled?: boolean
}

interface SplitterContextValue {
  orientation: SplitterOrientation
  value: number[]
  disabled: boolean
  adjustHandle: (handleIndex: number, deltaPercent: number) => void
}

const SplitterContext = React.createContext<SplitterContextValue | null>(null)

export interface SplitterPanelProps extends React.ComponentPropsWithoutRef<'div'> {
  index?: number
  collapsible?: boolean
  collapsedSize?: number
  minSize?: number
  maxSize?: number
}

export function SplitterPanel({
  children,
  index = 0,
  className,
  style,
  ...props
}: SplitterPanelProps) {
  const context = React.useContext(SplitterContext)
  const orientation = context?.orientation ?? 'horizontal'
  const size = context?.value[index] ?? 50

  return (
    <div
      data-reference-splitter-panel=""
      className={className}
      style={{
        flex: `0 0 ${size}%`,
        minWidth: orientation === 'horizontal' ? 0 : undefined,
        minHeight: orientation === 'vertical' ? 0 : undefined,
        overflow: 'auto',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export interface SplitterHandleProps extends React.ComponentPropsWithoutRef<'div'> {
  index?: number
  disabled?: boolean
}

export function SplitterHandle({
  index = 0,
  disabled: disabledProp,
  className,
  style,
  onKeyDown,
  ...props
}: SplitterHandleProps) {
  const context = React.useContext(SplitterContext)
  if (!context) return null

  const { orientation, value, disabled: groupDisabled, adjustHandle } = context
  const isDisabled = disabledProp ?? groupDisabled
  const currentVal = value[index] ?? 50
  const isHorizontal = orientation === 'horizontal'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled) return

    const step = e.shiftKey ? 10 : 1

    if (isHorizontal) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        adjustHandle(index, step)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        adjustHandle(index, -step)
      }
    } else {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        adjustHandle(index, step)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        adjustHandle(index, -step)
      }
    }
  }

  return (
    <div
      role="separator"
      tabIndex={isDisabled ? -1 : 0}
      aria-valuenow={Math.round(currentVal)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-orientation={orientation}
      data-reference-splitter-handle=""
      data-disabled={isDisabled ? '' : undefined}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        flex: '0 0 auto',
        width: isHorizontal ? 8 : '100%',
        height: isHorizontal ? '100%' : 8,
        backgroundColor: '#e5e7eb',
        cursor: isDisabled ? 'default' : isHorizontal ? 'col-resize' : 'row-resize',
        touchAction: 'none',
        outline: 'none',
        ...style,
      }}
      {...props}
    />
  )
}

export const Splitter = React.forwardRef<HTMLDivElement, SplitterProps>(
  function Splitter(
    {
      children,
      orientation = 'horizontal',
      value: valueProp,
      defaultValue = [50, 50],
      onChange,
      onChangeEnd,
      disabled = false,
      className,
      style,
      ...props
    },
    ref
  ) {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<number[]>(defaultValue)
    const value = isControlled ? valueProp : internalValue

    const adjustHandle = React.useCallback(
      (handleIndex: number, deltaPercent: number) => {
        if (handleIndex < 0 || handleIndex >= value.length - 1) return

        const leftSize = value[handleIndex]!
        const rightSize = value[handleIndex + 1]!

        let nextLeft = Math.max(5, Math.min(95, leftSize + deltaPercent))
        let nextRight = leftSize + rightSize - nextLeft

        if (nextRight < 5) {
          nextRight = 5
          nextLeft = leftSize + rightSize - nextRight
        }

        const nextValues = [...value]
        nextValues[handleIndex] = nextLeft
        nextValues[handleIndex + 1] = nextRight

        if (!isControlled) {
          setInternalValue(nextValues)
        }
        onChange?.(nextValues)
        onChangeEnd?.(nextValues)
      },
      [value, isControlled, onChange, onChangeEnd]
    )

    const contextValue = React.useMemo<SplitterContextValue>(
      () => ({
        orientation,
        value,
        disabled,
        adjustHandle,
      }),
      [orientation, value, disabled, adjustHandle]
    )

    return (
      <SplitterContext.Provider value={contextValue}>
        <div
          ref={ref}
          data-reference-splitter=""
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
          className={className}
          style={{
            display: 'flex',
            flexDirection: orientation === 'vertical' ? 'column' : 'row',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </SplitterContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SplitterProps & React.RefAttributes<HTMLDivElement>> & {
  Panel: typeof SplitterPanel
  Handle: typeof SplitterHandle
}

Splitter.Panel = SplitterPanel
Splitter.Handle = SplitterHandle
