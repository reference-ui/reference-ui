# isolation

"How closed hides" — the exiting panel's lockdown. Closed content turns
inert, hides from assistive tech, and drops pointer events until it
unmounts, restoring only the isolation it owns; force-mount-alone content
stays fully interactive instead, and author inert and aria-hidden pass
through untouched on open panels.

Up: Collapsible.
