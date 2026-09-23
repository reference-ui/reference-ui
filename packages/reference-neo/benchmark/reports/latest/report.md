# bench — latest

2026-09-23T09:51:57.737Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| enterprise+custom | 3,000 | 7,527 | 295.7 MiB | 335.2 MiB | 959ms | 3.2 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## enterprise+custom

seed 7 · 1 run(s) · generated in 1.35s

- peak RSS: 295.7 MiB
- peak HW: 335.2 MiB (OS high-water)
- sync time: 959ms
- bundle: 3.2 MiB (288.5 KiB gzip)

### load

- generator: app
- style files: 3,000 (+12,000 dead)
- css() calls: 7,527 · recipes: 120
- tokens: 300 colors / 64 spacing
- unique ratio: 0.35 · conditions: 0.35 · responsive: 0.3

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 959ms | 295.7 MiB | 335.2 MiB |

### bundle

- styles.css: 2.9 MiB (266.9 KiB gzip)
- runtime-data.mjs: 212.6 KiB (21.7 KiB gzip)
- total: 3.2 MiB (288.5 KiB gzip)
