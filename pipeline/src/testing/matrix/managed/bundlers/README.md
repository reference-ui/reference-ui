`bundlers/` owns the matrix fixtures' managed bundler surfaces.

Each supported bundler version lives in its own folder, such as `vite7/`, and
defines both the generated config files and the bundler-owned dependency
versions that `setup` writes into fixture packages.