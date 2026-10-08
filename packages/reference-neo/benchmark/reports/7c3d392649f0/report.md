# bench — 7c3d392649f0

2026-09-22T15:02:27.462Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | peak HW | sync | bundle |
| --- | --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 107.4 MiB | 107.4 MiB | 84ms | 179.4 KiB |
| medium | 250 | 635 | 123.9 MiB | 123.9 MiB | 140ms | 448.3 KiB |
| enterprise | 3,000 | 7,527 | 281.3 MiB | 281.4 MiB | 872ms | 2.9 MiB |

scorer bench-worker/2: peak RSS is the v1 in-loop sampler (history-comparable); peak HW is the OS high-water, a new series — never compare HW against old RSS.

## small

seed 7 · 5 run(s) · generated in 31ms

- peak RSS: 107.4 MiB
- peak HW: 107.4 MiB (OS high-water)
- sync time: 84ms
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
| 1 | 83ms | 107.4 MiB | 107.4 MiB |
| 2 | 85ms | 110.0 MiB | 110.0 MiB |
| 3 | 85ms | 108.1 MiB | 108.1 MiB |
| 4 | 84ms | 103.6 MiB | 103.6 MiB |
| 5 | 84ms | 107.2 MiB | 107.2 MiB |

### bundle

- styles.css: 90.5 KiB (12.3 KiB gzip)
- runtime-data.mjs: 88.9 KiB (18.3 KiB gzip)
- total: 179.4 KiB (30.6 KiB gzip)

## medium

seed 7 · 5 run(s) · generated in 103ms

- peak RSS: 123.9 MiB
- peak HW: 123.9 MiB (OS high-water)
- sync time: 140ms
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
| 1 | 139ms | 121.0 MiB | 121.0 MiB |
| 2 | 140ms | 123.9 MiB | 123.9 MiB |
| 3 | 139ms | 118.2 MiB | 118.2 MiB |
| 4 | 141ms | 125.4 MiB | 125.4 MiB |
| 5 | 141ms | 124.1 MiB | 124.1 MiB |

### bundle

- styles.css: 340.6 KiB (39.7 KiB gzip)
- runtime-data.mjs: 107.7 KiB (19.2 KiB gzip)
- total: 448.3 KiB (58.9 KiB gzip)

## enterprise

seed 7 · 5 run(s) · generated in 1.21s

- peak RSS: 281.3 MiB
- peak HW: 281.4 MiB (OS high-water)
- sync time: 872ms
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
| 1 | 879ms | 295.8 MiB | 295.9 MiB |
| 2 | 872ms | 281.3 MiB | 281.4 MiB |
| 3 | 864ms | 268.6 MiB | 268.7 MiB |
| 4 | 877ms | 282.1 MiB | 282.2 MiB |
| 5 | 868ms | 275.2 MiB | 275.2 MiB |

### bundle

- styles.css: 2.7 MiB (264.2 KiB gzip)
- runtime-data.mjs: 209.4 KiB (21.6 KiB gzip)
- total: 2.9 MiB (285.8 KiB gzip)
