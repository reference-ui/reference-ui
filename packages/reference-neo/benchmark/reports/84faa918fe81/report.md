# bench — 84faa918fe81

2026-09-30T16:09:49.522Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 116.1 MiB | 116.1 MiB | 132ms | 179.6 KiB |
| medium | 250 | 635 | 132.8 MiB | 133.0 MiB | 193ms | 448.4 KiB |
| enterprise | 3,000 | 7,527 | 318.9 MiB | 358.1 MiB | 950ms | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 3 run(s) · generated in 27ms

- peak RSS: 116.1 MiB
- peak HW: 116.1 MiB (OS high-water)
- sync time: 132ms
- bundle: 179.6 KiB (30.6 KiB gzip)

### load

- generator: app
- style files: 60 (+240 dead)
- css() calls: 171 · recipes: 6
- tokens: 80 colors / 30 spacing
- unique ratio: 0.15 · conditions: 0.25 · responsive: 0.2

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 319ms | 116.1 MiB | 116.1 MiB |
| 2 | 132ms | 120.6 MiB | 120.6 MiB |
| 3 | 132ms | 113.2 MiB | 113.2 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 89.0 KiB (18.3 KiB gzip)
- total: 179.6 KiB (30.6 KiB gzip)

## medium

seed 7 · 3 run(s) · generated in 100ms

- peak RSS: 132.8 MiB
- peak HW: 133.0 MiB (OS high-water)
- sync time: 193ms
- bundle: 448.4 KiB (59.0 KiB gzip)

### load

- generator: app
- style files: 250 (+1,000 dead)
- css() calls: 635 · recipes: 24
- tokens: 150 colors / 48 spacing
- unique ratio: 0.25 · conditions: 0.3 · responsive: 0.25

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 187ms | 126.2 MiB | 126.9 MiB |
| 2 | 193ms | 132.8 MiB | 133.0 MiB |
| 3 | 195ms | 133.9 MiB | 133.9 MiB |

### bundle

- styles.css: 340.7 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.8 KiB (19.2 KiB gzip)
- total: 448.4 KiB (59.0 KiB gzip)

## enterprise

seed 7 · 1 run(s) · generated in 1.16s

- peak RSS: 318.9 MiB
- peak HW: 358.1 MiB (OS high-water)
- sync time: 950ms
- bundle: 2.9 MiB (285.8 KiB gzip)

### load

- generator: app
- style files: 3,000 (+12,000 dead)
- css() calls: 7,527 · recipes: 120
- tokens: 300 colors / 64 spacing
- unique ratio: 0.35 · conditions: 0.35 · responsive: 0.3

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 950ms | 318.9 MiB | 358.1 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.6 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
