# MCP sync worker

Thread-pool worker for **`ref sync`**: listens for `run:mcp:*` events, runs heavy work in **`child-process/`** short-lived Node children so the worker isolate stays small.
