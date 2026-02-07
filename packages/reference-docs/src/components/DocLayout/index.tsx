import { Outlet } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';
import { DocSidebar } from './DocSidebar';

export function DocLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <DocSidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '2rem 3rem', maxWidth: 720 }}>
          <MDXProvider>
            <Outlet />
          </MDXProvider>
        </div>
      </main>
    </div>
  );
}
