# bench — 16487a111ae7

2026-09-22T20:35:27.965Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 110.3 MiB | 110.3 MiB | 85ms | 179.4 KiB |
| medium | 250 | 635 | 124.8 MiB | 124.8 MiB | 134ms | 448.3 KiB |
| enterprise | 3,000 | 7,527 | 381.7 MiB | 381.7 MiB | 744ms | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 5 run(s) · generated in 28ms

- peak RSS: 110.3 MiB
- peak HW: 110.3 MiB (OS high-water)
- sync time: 85ms
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
| 1 | 84ms | 110.2 MiB | 110.2 MiB |
| 2 | 87ms | 109.2 MiB | 109.2 MiB |
| 3 | 85ms | 111.7 MiB | 111.7 MiB |
| 4 | 85ms | 110.3 MiB | 110.3 MiB |
| 5 | 91ms | 111.2 MiB | 111.2 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 88.9 KiB (18.3 KiB gzip)
- total: 179.4 KiB (30.6 KiB gzip)

## medium

seed 7 · 5 run(s) · generated in 99ms

- peak RSS: 124.8 MiB
- peak HW: 124.8 MiB (OS high-water)
- sync time: 134ms
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
| 1 | 134ms | 124.8 MiB | 124.8 MiB |
| 2 | 136ms | 120.7 MiB | 120.7 MiB |
| 3 | 138ms | 122.1 MiB | 122.1 MiB |
| 4 | 134ms | 128.4 MiB | 128.4 MiB |
| 5 | 133ms | 124.9 MiB | 124.9 MiB |

### bundle

- styles.css: 340.6 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.7 KiB (19.2 KiB gzip)
- total: 448.3 KiB (58.9 KiB gzip)

## enterprise

seed 7 · 5 run(s) · generated in 1.13s

- peak RSS: 381.7 MiB
- peak HW: 381.7 MiB (OS high-water)
- sync time: 744ms
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
| 1 | 741ms | 381.3 MiB | 381.4 MiB |
| 2 | 744ms | 381.6 MiB | 381.7 MiB |
| 3 | 767ms | 391.3 MiB | 391.4 MiB |
| 4 | 759ms | 393.0 MiB | 393.1 MiB |
| 5 | 742ms | 381.7 MiB | 381.7 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.4 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
