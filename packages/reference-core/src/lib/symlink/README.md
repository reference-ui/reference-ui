# symlink

Small filesystem helpers for replacing and creating directory symlinks.

Right now this exists mainly for the packager install step, which writes package
output into `outDir` and then exposes that output through
`node_modules/@reference-ui/*` symlinks.

## What it owns

- removing an existing symlink or directory path safely
- creating a directory symlink with one shared implementation
- centralizing the `symlink-dir` / Windows "target must already exist" rule

## What it does not own

- deciding where generated packages should live
- package installation flow
- higher-level recovery logic around failed installs

## Testing note

This is intentionally a very thin wrapper around Node filesystem calls plus
`symlink-dir`.

The main value here is not custom algorithmic behavior. It is:

- keeping platform-specific symlink requirements in one place
- giving the packager a small, documented abstraction instead of ad hoc fs code

That makes documentation and a few higher-level integration tests more valuable
than heavy unit testing of this module in isolation.
