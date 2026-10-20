# Bench measurement

Runs each generated project through a real sync in a fresh child process per run. RSS sampling wraps the compile on an interval so peaks never share a heap; the worker emits one JSON line per run, the parent adds bundle sizes, and structurally malformed output fails the run instead of parsing silent.
