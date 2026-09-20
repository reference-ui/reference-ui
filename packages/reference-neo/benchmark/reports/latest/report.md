# bench — latest

2026-09-20T20:54:11.161Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | sync | bundle |
| --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 123.4 MiB | 156ms | 787.8 KiB |
| medium | 250 | 635 | 202.4 MiB | 466ms | 3.2 MiB |
| enterprise | 3,000 | 7,527 | 768.4 MiB | 3.52s | 18.2 MiB |

## small

seed 7 · 3 run(s) · generated in 47ms

- peak RSS: 123.4 MiB
- sync time: 156ms
- bundle: 787.8 KiB (63.3 KiB gzip)

### load

- generator: app
- style files: 60 (+240 dead)
- css() calls: 171 · recipes: 6
- tokens: 80 colors / 30 spacing
- unique ratio: 0.15 · conditions: 0.25 · responsive: 0.2

### runs

| # | sync | peak RSS |
| - | --- | ------- |
| 1 | 186ms | 123.4 MiB |
| 2 | 156ms | 121.8 MiB |
| 3 | 153ms | 123.8 MiB |

### bundle

- styles.css: 538.0 KiB (33.8 KiB gzip)
- runtime-data.mjs: 249.8 KiB (29.5 KiB gzip)
- total: 787.8 KiB (63.3 KiB gzip)

## medium

seed 7 · 3 run(s) · generated in 177ms

- peak RSS: 202.4 MiB
- sync time: 466ms
- bundle: 3.2 MiB (201.5 KiB gzip)

### load

- generator: app
- style files: 250 (+1,000 dead)
- css() calls: 635 · recipes: 24
- tokens: 150 colors / 48 spacing
- unique ratio: 0.25 · conditions: 0.3 · responsive: 0.25

### runs

| # | sync | peak RSS |
| - | --- | ------- |
| 1 | 467ms | 203.8 MiB |
| 2 | 466ms | 185.0 MiB |
| 3 | 458ms | 202.4 MiB |

### bundle

- styles.css: 2.4 MiB (142.7 KiB gzip)
- runtime-data.mjs: 789.7 KiB (58.8 KiB gzip)
- total: 3.2 MiB (201.5 KiB gzip)

## enterprise

seed 7 · 1 run(s) · generated in 1.33s

- peak RSS: 768.4 MiB
- sync time: 3.52s
- bundle: 18.2 MiB (1.0 MiB gzip)

### load

- generator: app
- style files: 3,000 (+12,000 dead)
- css() calls: 7,527 · recipes: 120
- tokens: 300 colors / 64 spacing
- unique ratio: 0.35 · conditions: 0.35 · responsive: 0.3

### runs

| # | sync | peak RSS |
| - | --- | ------- |
| 1 | 3.52s | 768.4 MiB |

### bundle

- styles.css: 14.3 MiB (825.0 KiB gzip)
- runtime-data.mjs: 3.9 MiB (211.3 KiB gzip)
- total: 18.2 MiB (1.0 MiB gzip)
