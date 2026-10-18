# bench — 488bcfd7a660

2026-09-30T16:04:24.530Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 115.1 MiB | 115.1 MiB | 135ms | 179.6 KiB |
| medium | 250 | 635 | 126.0 MiB | 126.9 MiB | 195ms | 448.4 KiB |
| enterprise | 3,000 | 7,527 | 310.3 MiB | 349.2 MiB | 961ms | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 3 run(s) · generated in 28ms

- peak RSS: 115.1 MiB
- peak HW: 115.1 MiB (OS high-water)
- sync time: 135ms
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
| 1 | 165ms | 112.8 MiB | 112.8 MiB |
| 2 | 135ms | 117.4 MiB | 117.4 MiB |
| 3 | 133ms | 115.1 MiB | 115.1 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 89.0 KiB (18.3 KiB gzip)
- total: 179.6 KiB (30.6 KiB gzip)

## medium

seed 7 · 3 run(s) · generated in 109ms

- peak RSS: 126.0 MiB
- peak HW: 126.9 MiB (OS high-water)
- sync time: 195ms
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
| 1 | 188ms | 120.2 MiB | 120.4 MiB |
| 2 | 195ms | 126.0 MiB | 126.9 MiB |
| 3 | 198ms | 130.1 MiB | 130.1 MiB |

### bundle

- styles.css: 340.7 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.8 KiB (19.2 KiB gzip)
- total: 448.4 KiB (59.0 KiB gzip)

## enterprise

seed 7 · 1 run(s) · generated in 1.32s

- peak RSS: 310.3 MiB
- peak HW: 349.2 MiB (OS high-water)
- sync time: 961ms
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
| 1 | 961ms | 310.3 MiB | 349.2 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.6 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
