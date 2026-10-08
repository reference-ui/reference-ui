# bench — 1e4e3a0b5ab6

2026-09-22T13:29:12.841Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 107.7 MiB | 107.7 MiB | 89ms | 179.4 KiB |
| medium | 250 | 635 | 127.1 MiB | 127.1 MiB | 158ms | 448.3 KiB |
| enterprise | 3,000 | 7,527 | 324.3 MiB | 326.7 MiB | 1.04s | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 5 run(s) · generated in 29ms

- peak RSS: 107.7 MiB
- peak HW: 107.7 MiB (OS high-water)
- sync time: 89ms
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
| 1 | 89ms | 106.8 MiB | 106.8 MiB |
| 2 | 89ms | 103.8 MiB | 103.8 MiB |
| 3 | 91ms | 107.7 MiB | 107.7 MiB |
| 4 | 89ms | 109.8 MiB | 109.8 MiB |
| 5 | 91ms | 110.1 MiB | 110.1 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 88.9 KiB (18.3 KiB gzip)
- total: 179.4 KiB (30.6 KiB gzip)

## medium

seed 7 · 5 run(s) · generated in 106ms

- peak RSS: 127.1 MiB
- peak HW: 127.1 MiB (OS high-water)
- sync time: 158ms
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
| 1 | 160ms | 131.2 MiB | 131.3 MiB |
| 2 | 154ms | 118.2 MiB | 118.3 MiB |
| 3 | 156ms | 125.9 MiB | 125.9 MiB |
| 4 | 158ms | 128.5 MiB | 128.6 MiB |
| 5 | 166ms | 127.1 MiB | 127.1 MiB |

### bundle

- styles.css: 340.6 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.7 KiB (19.2 KiB gzip)
- total: 448.3 KiB (58.9 KiB gzip)

## enterprise

seed 7 · 5 run(s) · generated in 1.21s

- peak RSS: 324.3 MiB
- peak HW: 326.7 MiB (OS high-water)
- sync time: 1.04s
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
| 1 | 1.03s | 323.3 MiB | 323.5 MiB |
| 2 | 1.04s | 324.3 MiB | 334.0 MiB |
| 3 | 1.04s | 326.6 MiB | 326.7 MiB |
| 4 | 1.05s | 338.0 MiB | 338.0 MiB |
| 5 | 1.03s | 297.8 MiB | 298.1 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.4 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
