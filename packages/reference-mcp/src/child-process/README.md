# MCP child process

Out-of-process model builds and cache prefetches.

Spawning takes a project directory and emits the child build result or a typed error, keeping analysis and config loads out of the server process. The entrypoint takes a JSON job payload naming the job plus working directory; fatal misuse exits nonzero on stderr.
