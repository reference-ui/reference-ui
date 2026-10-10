/**
 * Default toast: the title/description/action card the API renders for
 * plain content. Resolves every chrome slot from its options with the
 * item context as fallback, then composes the status icon, text column,
 * action row, and corner close into the root shell. { label, onClick }
 * actions render as parts; elements pass through untouched.
 */
import * as React from 'react'
import { ToastItemContext } from '../context'
import { ToastRoot } from './Root'
import { ToastTitle } from './Title'
import { ToastDescription } from './Description'
import { ToastAction } from './Action'
import { ToastCancel } from './Cancel'
import { ToastClose } from './Close'
import { StatusIcon } from './StatusIcon'
import type {
  ToastAction as ToastActionConfig,
  ToastActionOption,
  ToastClassNames,
  ToastType,
} from '../types'

function isActionOption(action: ToastActionConfig): action is ToastActionOption {
  return (
    action != null &&
    typeof action === 'object' &&
    !React.isValidElement(action) &&
    'label' in (action as ToastActionOption)
  )
}

function renderToastAction(action: ToastActionConfig, kind: 'action' | 'cancel') {
  if (React.isValidElement(action)) return action
  if (!isActionOption(action)) return null
  if (kind === 'cancel') {
    return <ToastCancel onClick={action.onClick}>{action.label}</ToastCancel>
  }
  return <ToastAction onClick={action.onClick}>{action.label}</ToastAction>
}

export function DefaultToast({
  title,
  options,
}: {
  title: React.ReactNode
  options?: {
    description?: React.ReactNode
    closeButton?: boolean
    type?: ToastType
    action?: ToastActionConfig
    cancel?: ToastActionConfig
    icon?: React.ReactNode
    richColors?: boolean
    invert?: boolean
    unstyled?: boolean
    className?: string
    style?: React.CSSProperties
    classNames?: ToastClassNames
  }
}) {
  const itemContext = React.useContext(ToastItemContext)
  const {
    description,
    closeButton = itemContext?.closeButton ?? false,
    type = (itemContext?.type as ToastType | undefined) ?? 'default',
    action,
    cancel,
    icon: customIcon,
    richColors = itemContext?.richColors,
    invert = itemContext?.invert,
    unstyled = itemContext?.unstyled,
    className,
    style,
    classNames,
  } = options ?? {}

  const resolvedClassNames = classNames ?? itemContext?.classNames

  return (
    <ToastRoot
      data-type={type}
      data-rich-colors={richColors ? 'true' : undefined}
      data-invert={invert ? 'true' : undefined}
      unstyled={unstyled}
      className={[resolvedClassNames?.toast, className, itemContext?.className].filter(Boolean).join(' ') || undefined}
      style={{ ...itemContext?.style, ...style }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <StatusIcon
          type={type}
          customIcon={customIcon}
          icons={itemContext?.icons}
          iconClassName={resolvedClassNames?.icon}
          loaderClassName={resolvedClassNames?.loader}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {(action || cancel) && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {action && renderToastAction(action, 'action')}
            {cancel && renderToastAction(cancel, 'cancel')}
          </div>
        )}
        {closeButton && <ToastClose data-corner="" />}
      </div>
    </ToastRoot>
  )
}
