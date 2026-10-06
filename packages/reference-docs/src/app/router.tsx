import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { DocLayout } from './DocLayout'
import { DocPage } from './DocPage'

const rootRoute = createRootRoute({ component: DocLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <DocPage slug="intro" />,
})

const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$slug',
  component: DocPage,
})

const routeTree = rootRoute.addChildren([indexRoute, docRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
