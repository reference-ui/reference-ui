# Tabs registry kernel

Pure ordering decisions: nearest-enabled fallback and document-position
comparison. The registry hook feeds live entries in; these functions
answer which tab a broken value falls back to and how entries sort —
with ties to the preceding tab and detached entries dropped. No React,
no refs; unit-tested in isolation while mount timing proves out in the
component suites.
