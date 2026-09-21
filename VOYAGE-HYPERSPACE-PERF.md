# Voyage perf log — Hyperspace Run

Every performance cycle ends here as one entry: what was tried, what
the bench said, what held, what did not. A disproven hypothesis is a
complete cycle — log it and move on. Terse entries; the diff holds
the detail.

Format per entry (append, never rewrite history):

```text
## Wave N, cycle M — <one-line hypothesis>
- Tried: <change, files touched>
- Bench (locked load, medians): <sync/RSS deltas vs wave-start pin, scale by scale>
- Stability: <acceptance result, churn guardrail result>
- Review: <reviewer verdict, VERIFIED or GAPS>
- Outcome: <landed | rode forward | died, and why in one line>
```

No entries yet.
