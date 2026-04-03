import TokensTest from './tests/TokensTest'
import ColorModeTest from './tests/ColorModeTest'
import SyncWatch from './tests/SyncWatch'
import TokenSyncWatch from './tests/TokenSyncWatch'
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
      <Route path={testRoutes.colorMode}>
        <ColorModeTest />
      </Route>
      <Route path={testRoutes.syncWatch}>
        <SyncWatch />
      </Route>
      <Route path={testRoutes.tokenSyncWatch}>
        <TokenSyncWatch />
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
