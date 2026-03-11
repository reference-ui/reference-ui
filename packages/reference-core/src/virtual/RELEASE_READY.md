# virtual release readiness

## Verdict

Not yet release-ready.

## Why

The `virtual` module is a narrow subsystem, but it sits on a critical boundary:

- it decides what Panda actually scans
- it rewrites source imports into the generated system shape
- it keeps watch-mode source changes flowing into the generated pipeline

If virtual is wrong, later stages can still run and appear healthy while Panda is
scanning stale files, missing files, or incorrectly rewritten files.

## What is already strong

There is meaningful downstream confidence today.

The current test surface proves:

- `.reference-ui/virtual` is created for a real app
- files matching include patterns are copied into the mirror
- `node_modules`, `.reference-ui`, and out-of-scope files stay out
- CSS import rewrites happen for `@reference-ui/react`
- `recipe()`-to-`cva()` rewrites happen in the virtual mirror
- MDX is converted into JSX output
- the mirror has no missing files and no orphan files in the app fixture
- watch-mode source edits update the virtual mirror
- watch-mode edits propagate all the way to visible runtime styling in the
  broader `reference-test` environment

That is good evidence that the live system behavior works.

## What is still missing

By the standard in `TEST_RELEASE_PLAN.md`, the main gap is still direct
`reference-core` ownership of the virtual contracts.

I did not find focused core-level tests that directly pin down:

- `copyAll()` include filtering and ignore behavior
- `copyToVirtual()` choosing copy-vs-transform correctly
- `removeFromVirtual()` unlink behavior for transformed extensions
- repeated edits and reruns staying deterministic
- native loader behavior across supported and unsupported platforms
- missing native binary behavior
- rewrite failure behavior and error contracts
- worker-level failure propagation for full copy and watch handling

That means confidence is still carried more by downstream artifact proof than by
fast local module tests in the subsystem itself.

## Practical judgment

`virtual` is in good shape for ongoing internal use.

Its responsibility is small, the current downstream tests are valuable, and the
real app/watch behavior looks healthy. But for a release-ready verdict, this area
still needs direct module tests because it sits upstream of Panda, packager, and
watch behavior. A quiet regression here can distort the whole pipeline.

## What would change the verdict

I would be comfortable calling this release-ready once `reference-core` directly
proves:

- mirror creation and filtering rules
- per-file add/change/unlink behavior
- transform path selection and transformed-extension cleanup
- native loader and rewrite error contracts
- at least one worker-level failure-path contract

That would move this subsystem from "strong downstream evidence" to "owned core
contract."
