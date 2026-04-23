# EVER_RUST

## Why this exists

`@reference-ui/rust` is too important to feel optional, but the current delivery model still makes native availability feel fragile.

We want one user experience:

- install dependencies
- run `ref sync`
- native features either work immediately or recover automatically
- failures are precise, actionable, and platform-aware

The goal is to make the Rust binary path feel boring.

## Current state

`@reference-ui/rust` already has a solid foundation:

- It is a `napi-rs` package with explicit targets in [packages/reference-rs/package.json](/Users/ryn/Developer/reference-ui/packages/reference-rs/package.json).
- It already ships a runtime loader with structured diagnostics in [packages/reference-rs/js/runtime/loader.ts](/Users/ryn/Developer/reference-ui/packages/reference-rs/js/runtime/loader.ts).
- It already has a local rebuild tool in [packages/reference-rs/js/tools/ensure-native.ts](/Users/ryn/Developer/reference-ui/packages/reference-rs/js/tools/ensure-native.ts).

So this is not a greenfield problem. The missing piece is install-time orchestration and fallback strategy.

## What we observed

### 1. Prebuilt delivery is not consistently reliable

Recent downstream matrix runs showed `@reference-ui/rust` missing its Linux binary inside the clean consumer install path. The loader message was explicit:

- no native binary found for `linux x64`
- reinstall dependencies so the package manager can fetch the correct prebuilt binary

Separately, there is repo knowledge that Apple Silicon GitHub Actions artifacts were published but did not reliably load in practice.

That means the current prebuilt path is not trustworthy enough to stand alone.

### 2. We already know how to build locally

`ensure-native.ts` already does the right local thing for contributors:

- detect the current target triple
- check whether the binary exists
- check whether the binary loads and exports the expected functions
- rebuild when missing, stale, or unloadable

That logic is exactly what we should reuse for fallback behavior.

### 3. Runtime degradation exists today, but it is not seamless

The loader returns structured statuses:

- `loaded`
- `unsupported-platform`
- `binary-not-found`
- `load-failed`
- `package-dir-not-found`

That is good. But today, if prebuilt artifacts are wrong or absent, users often only learn that at feature runtime instead of install time.

## Recommendation

Do not scrap prebuilt binaries.

The better model is:

1. Prebuilt binary is the fast path.
2. Local `napi-rs` build is the fallback path.
3. Runtime diagnostics remain the final guardrail.

This gives us:

- fast installs for common supported platforms
- universal recovery when a prebuilt is missing or broken
- fewer support cases caused by GitHub Actions packaging drift

Compiling on every install for every user would be slower, noisier, and more fragile than necessary.

## Desired install behavior

### Base flow

On install of `@reference-ui/rust`:

1. Try prebuilt binary resolution first.
2. If the binary loads, do nothing.
3. If status is `binary-not-found` or `load-failed`, try local compilation.
4. If local compilation succeeds, continue normally.
5. If local compilation cannot run, print a platform-aware failure message.

### When install should fail

Default recommendation: postinstall should be best-effort, not immediately fatal.

Reason:

- some native-backed features may be optional in certain workflows
- package installation should not become dramatically more fragile than feature execution

Instead:

- postinstall should attempt recovery
- runtime should still fail clearly when a required native feature is actually used

Optional future strict mode:

- `REFERENCE_UI_RUST_REQUIRE_NATIVE=1`
- makes postinstall fail hard if no working native binary can be obtained

## What the fallback needs to check

If prebuilt resolution fails and we want local compilation, the installer should verify:

- `rustc`
- `cargo`
- a usable C toolchain / linker

Practical checks:

```sh
rustc --version
cargo --version
cc --version
```

Platform notes:

- macOS: Xcode Command Line Tools are usually the real requirement.
- Linux: `gcc` or `clang`, libc headers, and normal build essentials.
- Windows: MSVC build tools are the real dependency surface.

The error message should say which probe failed.

## Implementation shape

### Add a postinstall script

In [packages/reference-rs/package.json](/Users/ryn/Developer/reference-ui/packages/reference-rs/package.json), add a `postinstall` script that runs a dedicated install fallback entrypoint.

That script should:

- call into the same loader diagnostic path used at runtime
- exit early if the binary is already healthy
- on `binary-not-found` or `load-failed`, try local build
- print concise status lines so users know which branch happened

Example statuses:

- `Using prebuilt native binary for aarch64-apple-darwin`
- `Prebuilt native binary missing for x86_64-unknown-linux-gnu; attempting local build`
- `Local native build succeeded`
- `Local native build skipped: rustc not found`

### Reuse `ensure-native`

We should not duplicate the rebuild logic.

Instead, factor `ensure-native.ts` so it can power both:

- contributor rebuild flows
- postinstall fallback flows

Likely split:

- one module for binary health detection
- one module for toolchain checks
- one module for local build execution
- thin entrypoints for `ensure-native` and `postinstall`

### Improve loader messaging

The existing loader message says prebuilt binaries should install automatically.

Once local fallback exists, the message should reflect reality.

Desired messaging:

- prebuilt was missing or unloadable
- local build was attempted or skipped
- exact reason if skipped
- exact command to run manually

## Environment controls

We should add a small set of env switches.

Recommended:

- `REFERENCE_UI_RUST_SKIP_POSTINSTALL_BUILD=1`
- `REFERENCE_UI_RUST_FORCE_LOCAL_BUILD=1`
- `REFERENCE_UI_RUST_REQUIRE_NATIVE=1`

These make the behavior testable and controllable in CI.

## E2E and matrix implications

This is secondary, but the optimization path is straightforward.

If local compile fallback becomes part of normal install behavior, the matrix should cache:

- Cargo registry
- Cargo git cache
- Rust `target/`
- the built `.node` artifact or the package directory that contains it

In Dagger terms, this means mounted caches for the Rust toolchain outputs, the same way the matrix already caches the PNPM store.

Important: optimization should not block the install fallback design.

## Recommendation summary

We should move to this model:

- keep GitHub Actions prebuilt binaries
- add local compile fallback in `postinstall`
- reuse existing `ensure-native` logic
- make failure messages toolchain-aware and platform-aware
- add env flags for CI, debugging, and strict mode

That gives us the best balance of:

- fast path for common users
- recovery path for broken artifacts or unsupported release publishing
- universal portability when the user does have Rust installed

## Concrete next steps

1. Extract binary health + rebuild logic out of `ensure-native.ts` into reusable helpers.
2. Add a `postinstall` entrypoint for `@reference-ui/rust`.
3. Add toolchain probes with precise failure messages.
4. Add env switches for skip, force-local, and require-native behavior.
5. Update loader messaging to mention local fallback results.
6. Add CI coverage for three cases:
   - prebuilt loads successfully
   - prebuilt missing, local build succeeds
   - prebuilt missing, local build unavailable
7. Add matrix caching for Rust build artifacts once the behavior is stable.

## Bottom line

The right long-term move is not "trust GitHub Actions artifacts more" and not "always compile locally".

It is:

- prebuilt first
- local build fallback second
- runtime diagnostics third

That is the most seamless way to make `@reference-ui/rust` feel universal.