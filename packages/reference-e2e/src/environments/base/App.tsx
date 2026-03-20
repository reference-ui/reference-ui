import TokensTest from './tests/TokensTest'
import SyncWatch from './tests/SyncWatch'
import ExtendsTest from './tests/ExtendsTest'
import LayersTest from './tests/LayersTest'
import StylePropsTest from './tests/StylePropsTest'
import ResponsiveContainerTest from './tests/ResponsiveContainerTest'
import { Route, Router } from './Router'
import { testRoutes } from './routes'

export default function App() {
  return (
    <Router>
      <Route path={testRoutes.tokens}>
        <TokensTest />
      </Route>
      <Route path={testRoutes.syncWatch}>
        <SyncWatch />
      </Route>
      <Route path={testRoutes.extends}>
        <ExtendsTest />
      </Route>
      <Route path={testRoutes.layers}>
        <LayersTest />
      </Route>
      <Route path={testRoutes.styleProps}>
        <StylePropsTest />
      </Route>
      <Route path={testRoutes.responsiveContainer}>
        <ResponsiveContainerTest />
      </Route>
    </Router>
  )
}
