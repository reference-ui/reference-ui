# Menu focus

Focus moves and discovery. Restoration returns focus to the root
trigger on dismiss (skipping disabled or detached triggers) and hands
Tab past the trigger to the next tabbable. Item discovery scopes to
one level, moves to first and edge items, and mirrors the 1D roving
mapping on the container itself for pointer-opened menus. Owning-root
reads run id and focus discovery against a shadow-hosted node's own
root instead of the document. Unit-tested in happy-dom.
