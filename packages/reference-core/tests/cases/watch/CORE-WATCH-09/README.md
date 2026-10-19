# CORE-WATCH-09 — concurrent one-shots end in exit 0 or exit 75, never by a signal or exit 1, and the last sync wins

Evidence: the sync session lock (the session lock modules). A burst of
one-shot syncs against one project is the last-wins contract under load: every newcomer kills the holder it finds, so
the losers must leave by exit 75 naming their superseder and exactly the last one must finish with exit 0.

The spec builds a temp world, syncs it, then holds five `ref sync` processes at a gate in the config so they all reach
the lock in the same instant. Opening the gate starts four rounds of the five-way race, each over a fresh brand. A
loser the old code let die by SIGTERM (its stop handlers went on after its owner document was visible), or exit 1
(`ENOTEMPTY` removing the lock dir, `EINVAL` writing the owner tmp file when a takeover's remove met a claimer's
write) breaks the round. Every process must end with exit 0 or 75 and no signal, at least one must win with 0, every 75
must name its superseder, the lock must be gone afterwards, and the sheet must carry the round's brand.

> Search terms: sync lock, five-way contention, last wins, exit 75, superseded, SIGTERM death, handlers before owner, ENOTEMPTY, EINVAL, takeover race, concurrent one-shots, CORE-WATCH-09
