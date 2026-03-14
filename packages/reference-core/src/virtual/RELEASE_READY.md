# virtual release readiness

## Verdict

Release-ready inside `reference-core`.

## Why

The `virtual` module is still a narrow subsystem, but it now owns its dangerous
contracts directly instead of relying mostly on downstream proof.

`reference-core` now has focused tests for:

- `copyAll()` directory creation, include handling, and completion behavior
- `copyToVirtual()` selecting copy vs transform
- `removeFromVirtual()` cleaning up transformed extensions
- `worker.ts` success paths and failure propagation through `virtual:failed`
- `@reference-ui/rust` loader supported-target resolution and missing-binary behavior

Those direct tests sit alongside the existing downstream checks that already
prove the live mirror, rewrite behavior, MDX conversion, watch updates, and
end-to-end styling flow in real apps.

## What changed the verdict

The biggest release-readiness gaps were:

- no direct core tests for the mirror/copy contracts
- weak worker failure propagation
- a native loader platform map that implied Linux arm64 support even though the
  declared native targets did not

That is now tightened up:

- failures in full copy and per-file watch sync emit `virtual:failed`
- sync treats `virtual:failed` as a pipeline failure
- the native loader now matches the documented supported targets:
  - macOS x64 / arm64
  - Linux x64 GNU
  - Windows x64 MSVC

## Remaining release gate

There is still one package-level responsibility outside the module itself:

- CI should build and smoke-test the native artifact on every supported target

That is a publication gate for `@reference-ui/core`, not a blocker for calling
the `virtual` subsystem release-ready on its own implementation and contract
surface.
