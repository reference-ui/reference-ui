# bench — fc79ddfc35d3

2026-09-22T19:36:36.669Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 111.5 MiB | 111.5 MiB | 87ms | 179.4 KiB |
| medium | 250 | 635 | 123.6 MiB | 123.6 MiB | 136ms | 448.3 KiB |
| enterprise | 3,000 | 7,527 | 393.6 MiB | 393.7 MiB | 762ms | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 5 run(s) · generated in 58ms

- peak RSS: 111.5 MiB
- peak HW: 111.5 MiB (OS high-water)
- sync time: 87ms
- bundle: 179.4 KiB (30.6 KiB gzip)

### load

- generator: app
- style files: 60 (+240 dead)
- css() calls: 171 · recipes: 6
- tokens: 80 colors / 30 spacing
- unique ratio: 0.15 · conditions: 0.25 · responsive: 0.2

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 149ms | 105.3 MiB | 105.3 MiB |
| 2 | 88ms | 111.5 MiB | 111.5 MiB |
| 3 | 86ms | 109.1 MiB | 109.1 MiB |
| 4 | 87ms | 116.9 MiB | 116.9 MiB |
| 5 | 87ms | 112.7 MiB | 112.7 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 88.9 KiB (18.3 KiB gzip)
- total: 179.4 KiB (30.6 KiB gzip)

## medium

seed 7 · 5 run(s) · generated in 111ms

- peak RSS: 123.6 MiB
- peak HW: 123.6 MiB (OS high-water)
- sync time: 136ms
- bundle: 448.3 KiB (58.9 KiB gzip)

### load

- generator: app
- style files: 250 (+1,000 dead)
- css() calls: 635 · recipes: 24
- tokens: 150 colors / 48 spacing
- unique ratio: 0.25 · conditions: 0.3 · responsive: 0.25

### runs

| # | sync | peak RSS | peak HW |
| - | --- | ------- | ------ |
| 1 | 134ms | 123.6 MiB | 123.6 MiB |
| 2 | 136ms | 124.4 MiB | 124.4 MiB |
| 3 | 137ms | 123.0 MiB | 123.0 MiB |
| 4 | 136ms | 126.5 MiB | 126.5 MiB |
| 5 | 136ms | 122.6 MiB | 122.6 MiB |

### bundle

- styles.css: 340.6 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.7 KiB (19.2 KiB gzip)
- total: 448.3 KiB (58.9 KiB gzip)

## enterprise

seed 7 · 5 run(s) · generated in 1.27s

- peak RSS: 393.6 MiB
- peak HW: 393.7 MiB (OS high-water)
- sync time: 762ms
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
| 1 | 762ms | 393.6 MiB | 393.7 MiB |
| 2 | 750ms | 395.6 MiB | 395.6 MiB |
| 3 | 758ms | 385.1 MiB | 385.1 MiB |
| 4 | 771ms | 391.5 MiB | 391.6 MiB |
| 5 | 777ms | 395.0 MiB | 395.1 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.4 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
