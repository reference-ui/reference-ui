# bench — latest

2026-09-24T21:46:40.085Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 115.5 MiB | 115.5 MiB | 109ms | 179.5 KiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 1 run(s) · generated in 28ms

- peak RSS: 115.5 MiB
- peak HW: 115.5 MiB (OS high-water)
- sync time: 109ms
- bundle: 179.5 KiB (30.6 KiB gzip)

### load

- generator: app
- style files: 60 (+240 dead)
- css() calls: 171 · recipes: 6
- tokens: 80 colors / 30 spacing
- unique ratio: 0.15 · conditions: 0.25 · responsive: 0.2

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 109ms | 115.5 MiB | 115.5 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 89.0 KiB (18.3 KiB gzip)
- total: 179.5 KiB (30.6 KiB gzip)
