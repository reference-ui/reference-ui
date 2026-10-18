# hooks

The popover's behavior as one composed session. The hover-intent hook
owns open state, the hover session, and the trigger/content/focus
handlers, returning the context value the root provides — so the root
stays composition and every timing decision lives in a single home. The
hover bridge borrows the session and timer controls from the same
return for its document-level travel tracking.

Content's close restore is the one hook outside that session: Popover
runs no FocusLock, so when it closes with focus inside Content the hook
returns focus to the Trigger (or the `restoreFocus` target). The move
goes through the intent's `returnFocus`, so a hover card does not read
it as a keyboard visit and reopen.
