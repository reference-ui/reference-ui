# In-memory bundling seam

Bundles config and fragment sources with esbuild without touching disk. The working directory pins to the package root so banners and metafile keys never depend on the caller's cwd; heavy build-tool deps stay external, MDX compiles through its loader, and React-family imports resolve to a zero-runtime stub.
