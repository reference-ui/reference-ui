# GitHub

Continuous integration for the monorepo: every workflow here gates a
shipped surface. Consumer smoke packs the built library into a bare
Vite app and mounts every component with zero console errors; the Rust
workflows compile the native core and run its test suites; core-vendor
pins the vendored base; docs builds and deploys the site to GitHub
Pages; security scans dependencies. A red workflow blocks its release
surface — fix the cause, never the gate.
