# Native scan

Single-read fragment discovery with process-side retention. Enumerated paths plus needle bytes yield needle-hit contents while the full compile set stays retained behind a monotonic token; each file reads once with short-rule reads and lossy UTF-8; compile drains the retained bytes by move behind exactly-one-of, and reused or unknown tokens fail loud instead of re-reading disk.
