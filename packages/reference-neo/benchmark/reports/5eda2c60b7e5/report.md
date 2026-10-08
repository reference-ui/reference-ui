# bench — 5eda2c60b7e5

2026-09-20T20:55:41.248Z · darwin x64 · 64.0 GiB RAM · node v24.16.0

## summary

| scale | files | css() calls | peak RSS | sync | bundle |
| --- | --- | --- | --- | --- | --- |
| small | 60 | 171 | 121.8 MiB | 150ms | 787.8 KiB |
| medium | 250 | 635 | 207.6 MiB | 461ms | 3.2 MiB |
| enterprise | 3,000 | 7,527 | 796.0 MiB | 3.51s | 18.2 MiB |

## small

seed 7 · 3 run(s) · generated in 27ms

- peak RSS: 121.8 MiB
- sync time: 150ms
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
| 1 | 149ms | 125.1 MiB |
| 2 | 150ms | 121.8 MiB |
| 3 | 151ms | 121.1 MiB |

### bundle

- styles.css: 538.0 KiB (33.8 KiB gzip)
- runtime-data.mjs: 249.8 KiB (29.5 KiB gzip)
- total: 787.8 KiB (63.3 KiB gzip)

## medium

seed 7 · 3 run(s) · generated in 100ms

- peak RSS: 207.6 MiB
- sync time: 461ms
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
| 1 | 452ms | 209.3 MiB |
| 2 | 461ms | 207.6 MiB |
| 3 | 469ms | 202.5 MiB |

### bundle

- styles.css: 2.4 MiB (142.7 KiB gzip)
- runtime-data.mjs: 789.7 KiB (58.8 KiB gzip)
- total: 3.2 MiB (201.5 KiB gzip)

## enterprise

seed 7 · 1 run(s) · generated in 1.14s

- peak RSS: 796.0 MiB
- sync time: 3.51s
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
| 1 | 3.51s | 796.0 MiB |

### bundle

- styles.css: 14.3 MiB (825.0 KiB gzip)
- runtime-data.mjs: 3.9 MiB (211.3 KiB gzip)
- total: 18.2 MiB (1.0 MiB gzip)
