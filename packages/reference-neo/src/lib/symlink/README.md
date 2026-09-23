# symlink

Cross-platform directory symlinks for generated package links, in one
place. Symlinking is not free: Windows requires the target to exist as
a directory up front, junctions behave differently from POSIX symlinks,
and stale scope links survive renames — so every sharp edge lives here,
behind three functions, instead of scattered as ad-hoc fs calls.

Ported from `packages/reference-legacy/src/lib/symlink/` (file motion
with renames, no logic change): `prepare-link-path-for-symlink.ts` is
now `prepare.ts`, everything else kept its shape and its tests.

## What it owns

- creating a directory symlink over whatever sat there (`createSymlink`;
  no-op when the link already points at the target)
- removing a symlink-or-directory path safely (`removeSymlinkOrDir`)
- pruning dead scope links from mixed dirs (`pruneBrokenSymlinksInDir`)
- the Windows "target must already exist" precondition, enforced once
  (`symlink-dir` does the platform dispatch underneath)

## What it does not own

- where generated packages live (the packager's layout)
- when links get created or torn down (assembly up, clean down)
- recovery policy around failed installs

## Consumers

Nobody yet — this port lands the module and its tests ahead of the
rewire. Natural first adopter: the packager's links leg
(`sync/publish/links.ts`), whose hand-rolled junction replace is
exactly the ad-hoc code this module exists to delete.
