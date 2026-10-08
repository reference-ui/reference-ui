# bench — c43f355918f7

2026-10-07T23:42:34.917Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small+custom | 60 | 171 | 132.8 MiB | 133.6 MiB | 918ms | 229.2 KiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small+custom

seed 7 · 3 run(s) · generated in 51ms

- peak RSS: 132.8 MiB
- peak HW: 133.6 MiB (OS high-water)
- sync time: 918ms
- bundle: 229.2 KiB (33.8 KiB gzip)

### load

- generator: app
- style files: 60 (+240 dead)
- css() calls: 171 · recipes: 6
- mdx fragments: 120 (+120 fence decoys)
- tokens: 80 colors / 30 spacing
- unique ratio: 0.15 · conditions: 0.25 · responsive: 0.2

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 963ms | 134.9 MiB | 135.5 MiB |
| 2 | 918ms | 132.8 MiB | 133.6 MiB |
| 3 | 911ms | 130.5 MiB | 131.9 MiB |

### bundle

- styles.css: 130.5 KiB (14.8 KiB gzip)
- runtime-data.mjs: 98.7 KiB (19.0 KiB gzip)
- total: 229.2 KiB (33.8 KiB gzip)
