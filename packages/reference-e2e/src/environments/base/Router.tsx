import { Children, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

interface RouteProps {
  path: string
  children: ReactNode
}

interface RouterProps {
  children: ReactNode
  notFound?: ReactNode
}

export function Route({ children }: RouteProps) {
  return <>{children}</>
}

export function Router({ children, notFound = null }: RouterProps) {
  const currentPath = window.location.pathname

  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue
    if (child.type !== Route) continue

    const route = child as ReactElement<RouteProps>
    if (route.props.path === currentPath) {
      return <>{route.props.children}</>
    }
  }

  if (currentPath === '/') {
    return null
  }

  if (notFound !== null) {
    return <>{notFound}</>
  }

  return <div>Unknown test route: {currentPath}</div>
}
