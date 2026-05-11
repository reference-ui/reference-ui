import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { Div } from '@reference-ui/react'
import { DocLayout } from './components/DocLayout'
import { DocPage } from './components/DocPage'
import { slugToModule } from './collections/runtime'

const rootRoute = createRootRoute({ component: DocLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const Doc = slugToModule['intro']
    if (!Doc) {
      return (
        <Div color="docsMuted" fontSize="md">
          Not found
        </Div>
      )
    }
    return <Doc />
  },
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
