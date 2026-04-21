import { createRootRoute, createRoute } from '@tanstack/react-router'
import { Div } from '@reference-ui/react'
import { DocLayout } from '../components/DocLayout'
import { DocPage } from '../components/DocPage'
import { slugToModule } from '../lib/docs'
import { SyncWatchDebugPage } from './SyncWatchDebugPage'

const rootRoute = createRootRoute({ component: DocLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const mod = slugToModule['intro']
    if (!mod) {
      return (
        <Div color="docsMuted" fontSize="md">
          Not found
        </Div>
      )
    }
    const Doc = mod.default
    return <Doc />
  },
})

const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$slug',
  component: DocPage,
})

const syncWatchDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/sync-watch',
  component: SyncWatchDebugPage,
})

export const routeTree = rootRoute.addChildren([indexRoute, docRoute, syncWatchDebugRoute])
