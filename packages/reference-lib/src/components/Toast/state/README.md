# state

The substrate every toast lives in: one subscriber-notified store per
document, document routing for targeted versus ambient calls, the capped
history behind getHistory, and the record core (show/update/dismiss/
remove) with its option precedence and generation guards. Defaults and
the FIFO visibility window live in the root queue kernel, which stays
whole for its ReferenceLibrary importer — state reads them from there.
The public API is a thin caller; the TO-ID/OPT/QUEUE/TIME/CLOSE suites
prove the semantics here, through the same entries the host uses.
