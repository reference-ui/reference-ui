# Bench reporting

Turns finished runs into pinned reports. Dirty trees overwrite the rolling latest slot, clean trees pin a commit-hash folder, each holding a JSON record for machines and a markdown readout for humans. Shared formatters keep every number rendering one way; the pin resolves before generation so writing never dirties its own verdict.
