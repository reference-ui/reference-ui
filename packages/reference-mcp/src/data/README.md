# MCP icon data

Prebuilt icon search data the runtime loads.

One record per icon slug carries visual, usage, and category metadata, and the serialized search index beside it answers ranked queries at import time. Both are build outputs: regenerate them through the package scripts, never by hand.
