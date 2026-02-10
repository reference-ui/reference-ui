import { Outlet } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';
import { Div, Main } from '@reference-ui/core';
import { DocSidebar } from './DocSidebar';

export function DocLayout() {
  return (
    <Div
      w="100vw"
      minHeight="100vh"
      display="grid"
      gridTemplateColumns="1fr minmax(0, 90ex) 1fr"
    >
      <Div
        minHeight="100vh"
        display="flex"
        justifyContent="flex-end"
      >
        <DocSidebar />
      </Div>
      <Main minHeight="100vh" minWidth="0" overflow="auto">
        <Div padding="10r" minWidth="0" w="100%">
          <MDXProvider>
            <Outlet />
          </MDXProvider>
        </Div>
      </Main>
      <Div minHeight="100vh" />
    </Div>
  );
}
