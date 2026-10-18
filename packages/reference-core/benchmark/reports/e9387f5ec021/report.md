# bench — e9387f5ec021

2026-09-30T16:06:19.770Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 117.0 MiB | 117.0 MiB | 138ms | 179.6 KiB |
| medium | 250 | 635 | 130.4 MiB | 130.7 MiB | 193ms | 448.4 KiB |
| enterprise | 3,000 | 7,527 | 323.8 MiB | 358.7 MiB | 951ms | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 3 run(s) · generated in 28ms

- peak RSS: 117.0 MiB
- peak HW: 117.0 MiB (OS high-water)
- sync time: 138ms
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
| 1 | 315ms | 117.0 MiB | 117.0 MiB |
| 2 | 134ms | 118.8 MiB | 118.8 MiB |
| 3 | 138ms | 116.8 MiB | 116.8 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 89.0 KiB (18.3 KiB gzip)
- total: 179.6 KiB (30.6 KiB gzip)

## medium

seed 7 · 3 run(s) · generated in 100ms

- peak RSS: 130.4 MiB
- peak HW: 130.7 MiB (OS high-water)
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
| 1 | 189ms | 130.4 MiB | 130.7 MiB |
| 2 | 193ms | 125.5 MiB | 125.5 MiB |
| 3 | 195ms | 131.5 MiB | 131.7 MiB |

### bundle

- styles.css: 340.7 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.8 KiB (19.2 KiB gzip)
- total: 448.4 KiB (59.0 KiB gzip)

## enterprise

seed 7 · 1 run(s) · generated in 1.17s

- peak RSS: 323.8 MiB
- peak HW: 358.7 MiB (OS high-water)
- sync time: 951ms
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
| 1 | 951ms | 323.8 MiB | 358.7 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.6 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
