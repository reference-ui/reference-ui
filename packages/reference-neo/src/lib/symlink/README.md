# symlink

Cross-platform directory symlinks for generated package links, in one
place. Symlinking is not free: Windows requires the target to exist as
a directory up front, junctions behave differently from POSIX symlinks,
and stale scope links survive renames — so every sharp edge lives here,
behind three functions, instead of scattered as ad-hoc fs calls.

Ported from `packages/reference-legacy/src/lib/symlink/` (file motion
with renames): `prepare-link-path-for-symlink.ts` is now `prepare.ts`,
and the `symlink-dir` call follows the v10 named export
(`symlinkDirSync`) — legacy pins v9, whose default-export-plus-`.sync`
shape no longer exists. `removeGeneratedLink` is new in Neo: legacy's
clean removes scope entries unconditionally, while Neo's clean keeps
hand-placed dirs, so the guard lives here instead of ad-hoc in the bin.

## What it owns

- creating a directory symlink over whatever sat there (`createSymlink`;
  no-op when the link already points at the target)
- removing a symlink-or-directory path safely (`removeSymlinkOrDir`)
- removing one generated scope link only when it points at or inside
  the out dir (`removeGeneratedLink`; hand-placed entries stay put)
- pruning dead scope links from mixed dirs (`pruneBrokenSymlinksInDir`)
- the Windows "target must already exist" precondition, enforced once
  (`symlink-dir` does the platform dispatch underneath)

## What it does not own

- where generated packages live
- when links get created or torn down
- recovery policy around failed installs

## Consumers

- the packager's links leg, via `createSymlink`
- `neo clean`, via `removeGeneratedLink`

Every link call-site in Neo routes through here; nothing outside this
module touches `symlink`/`readlink`/`unlink` for generated links.
