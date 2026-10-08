# bench — b3181fa935ee

2026-09-22T10:58:38.790Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 107.7 MiB | 107.7 MiB | 94ms | 179.4 KiB |
| medium | 250 | 635 | 127.2 MiB | 127.6 MiB | 161ms | 448.3 KiB |
| enterprise | 3,000 | 7,527 | 346.5 MiB | 346.6 MiB | 1.07s | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 3 run(s) · generated in 30ms

- peak RSS: 107.7 MiB
- peak HW: 107.7 MiB (OS high-water)
- sync time: 94ms
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
| 1 | 97ms | 114.8 MiB | 114.8 MiB |
| 2 | 94ms | 107.7 MiB | 107.7 MiB |
| 3 | 90ms | 107.4 MiB | 107.4 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 88.9 KiB (18.3 KiB gzip)
- total: 179.4 KiB (30.6 KiB gzip)

## medium

seed 7 · 3 run(s) · generated in 106ms

- peak RSS: 127.2 MiB
- peak HW: 127.6 MiB (OS high-water)
- sync time: 161ms
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
| 1 | 161ms | 129.0 MiB | 131.2 MiB |
| 2 | 162ms | 119.5 MiB | 121.9 MiB |
| 3 | 160ms | 127.2 MiB | 127.6 MiB |

### bundle

- styles.css: 340.6 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.7 KiB (19.2 KiB gzip)
- total: 448.3 KiB (58.9 KiB gzip)

## enterprise

seed 7 · 1 run(s) · generated in 1.20s

- peak RSS: 346.5 MiB
- peak HW: 346.6 MiB (OS high-water)
- sync time: 1.07s
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
| 1 | 1.07s | 346.5 MiB | 346.6 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.4 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
