import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router'
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
  component: () => <DocPage slug="initialize" />,
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

/** The old Colors page split into Palette and Colour, now one Color page; keep its URL working. */
const colorsRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/colors',
  beforeLoad: () => {
    throw redirect({ to: '/$slug', params: { slug: 'color' } })
  },
})

const routeTree = rootRoute.addChildren([
  docsRoute.addChildren([indexRoute, docRoute]),
  diagramRoute,
  colorsRedirectRoute,
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
