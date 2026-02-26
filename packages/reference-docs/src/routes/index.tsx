import { createRootRoute, createRoute } from '@tanstack/react-router';
import { DocLayout } from '../components/DocLayout';
import { DocPage } from '../components/DocPage';
import { slugToModule } from '../lib/docs';

const rootRoute = createRootRoute({ component: DocLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const mod = slugToModule['intro'];
    if (!mod) return <div>Not found</div>;
    const Doc = mod.default;
    return <Doc />;
  },
});

const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$slug',
  component: DocPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, docRoute]);
