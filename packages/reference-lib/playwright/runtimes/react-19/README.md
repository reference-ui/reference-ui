# React 19 CT runtime

Pinned React 19 host for component tests.

It renders through `createRoot` with synchronous `flushSync` updates behind the shared host contract, with its own manifest pinning the major and its own Vite aliases pointing the gallery at it. This is the default major.
