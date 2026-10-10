# hooks

The tooltip's behavior as one composed session. The intent hook owns open
state, pending timers, warm-group coordination, and the trigger/content
handlers, returning the context value the root provides — so the root
stays composition and every timing decision lives in a single testable
home.
