# api

The public calling surface: the toast callable with its Sonner vocabulary
(show/update/dismiss, message/custom, success/error/warning/info/loading),
promise rewriting from settlement values, generation-guarded defined
toasts, and opt-in screen-reader announcements. Thin by design — every
entry resolves content versus title, announces, and delegates to the
record core in state. The TO-DEF and promise suites prove behavior here;
the shared TO suites exercise these same entries against the store.
