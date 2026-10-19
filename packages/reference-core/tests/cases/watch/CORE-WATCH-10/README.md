# CORE-WATCH-10 — a lock whose pid was recycled to an unrelated process is stale: it is never signaled, attached to, or obeyed

Evidence: the sync session lock (the session identity). An owner document names a pid, and the OS
recycles pids: a lock left by a dead sync can name a pid that now belongs to an unrelated process, or to pid 1. The
owner now records its process start time, and a pid whose running process has a different one is not the holder.

The spec makes temp worlds and plants the lock a dead sync would leave, naming a live `sleep` it started (or pid 1),
under a recorded start time that the running process does not have. Only that mismatch of two known identities makes a
pid recycled: an owner that recorded no identity, or a host whose `ps` failed, reads as live while the pid exists, so a
lock is never stolen on a failed probe (unit-tested in the session-identity coverage). Four legs: a one-shot over
a stale one-shot lock must take over with a stale notice and leave the sleeper running (the old code sent it SIGTERM,
"superseding"); a one-shot over a stale watch lock must sync, not poke (the old code sent SIGUSR2, which kills a process
with no handler, then reported covered with stale output); `ref sync --watch` over a stale watch lock must boot, not
attach to the stranger and block forever; and a lock naming pid 1 must be taken over, not refuse every sync with `cannot
supersede sync pid 1 (EPERM)`. POSIX only, and it needs `ps` or `/proc` to read an identity; elsewhere the spec says so
and stands down.

> Search terms: recycled pid, stale lock, process identity, start time, unrelated process signalled, SIGTERM, SIGUSR2, pid 1, EPERM, attach hangs, covered stale, CORE-WATCH-10
