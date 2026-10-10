import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { DocLayout } from './DocLayout'
import { DocPage } from './DocPage'
import { DiagramPage } from '../content/diagrams/DiagramPage'

const rootRoute = createRootRoute()

/** Pathless layout: everything here renders inside the docs shell. */
const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'docs',
  component: DocLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: '/',
  component: () => <DocPage slug="intro" />,
})

const docRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: '/$slug',
  component: DocPage,
})

/** Private gallery: full-bleed, outside the shell. Static paths outrank $slug. */
const diagramRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/diagram',
  component: DiagramPage,
})

const routeTree = rootRoute.addChildren([
  docsRoute.addChildren([indexRoute, docRoute]),
  diagramRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
