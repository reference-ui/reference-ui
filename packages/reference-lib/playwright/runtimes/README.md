# CT runtimes

React-major selection for component tests.

The majors list and default resolve the `CT_REACT` environment choice, the Vite overlay repoints the gallery config at the selected major with the shared React dedupe stripped, and one directory per supported major holds its pinned host. The host contract keeps every major behind the same mount interface.
