# CLI Structure Map

Complete map of the CLI codebase for restructuring. Tree shows directory structure; each file lists its components/functions and what they do.

---

## File Tree

```
cli/
├── index.ts
│   └── main() — CLI entry. Commander with ref, sync (default) commands
│   └── runCommand wrapper for error handling
│
├── sync/
│   ├── index.ts
│   │   └── syncCommand(cwd, options) — Orchestration: load config, init event bus/log/watch/virtual/packager/system/packager-ts
│   │   └── SyncOptions (export)
│   └── types.ts
│       └── SyncOptions — { watch?: boolean }
│
├── lib/
│   ├── index.ts
│   │   └── Re-exports: log, runCommand, resolveCorePackageDir
│   ├── log.ts
│   │   └── printInfo, printDebug, printError — Direct console output
│   │   └── timestamp() — HH:mm:ss.ms
│   │   └── log, log.error, log.info, log.debug — Main log (main thread direct, workers via bus)
│   │   └── initLog(config) — Enables debug, subscribes to log events
│   ├── run-command.ts
│   │   └── createErrorHandler(actionName)
│   │   └── runCommand(execute) — Try/catch wrapper, exits on error
│   ├── resolve-core.ts
│   │   └── resolveCorePackageDir(fromCwd) — Resolves @reference-ui/core dir (Node + monorepo fallback)
│   ├── child-process.ts
│   │   └── getProcessRssMb(pid)
│   │   └── spawnMonitored(command, args, options) — Child with memory monitoring
│   │   └── spawnMonitoredAsync(...) — Waits for exit, returns peakChildRssMb, parentRssDeltaMb
│   │   └── MonitoredSpawnOptions, MonitoredChildProcess
│   └── microbundle.ts
│       └── microBundle(entryPath, options) — esbuild bundle → string
│       └── microBundlePanda(entryPath) — Panda externals
│       └── transformMdx(mdxContent, sourceFile) — MDX → JS via @mdx-js/esbuild
│
├── config/
│   ├── index.ts
│   │   └── ReferenceUIConfig — include, virtualDir?, normalizeCss?, useDesignSystem?, debug?
│   │   └── defineConfig(cfg)
│   │   └── loadUserConfig (re-export)
│   └── load-config.ts
│       └── loadConfigFile(configPath, options) — Bundle + eval config
│       └── loadUserConfig(cwd) — ui.config.ts/js/mjs, validates include
│
├── event-bus/
│   ├── index.ts
│   │   └── bus — EventEmitter (legacy)
│   │   └── broadcastChannel — BroadcastChannel cross-thread
│   │   └── initEventBus()
│   │   └── emit, on, once, off — Typed event API
│   ├── config.ts
│   │   └── config — { debug: false }
│   └── events.ts
│       └── LogEvents, WatchEvents, SystemEvents, PackagerEvents, VirtualEvents
│       └── Events — Union of all payload types
│
├── watch/
│   ├── index.ts
│   │   └── Re-exports: initWatch, runWatch, WatchPayload
│   ├── init.ts
│   │   └── initWatch(sourceDir, config, options) — Starts watch worker when options.watch
│   ├── types.ts
│   │   └── WatchOptions, WatchPayload, FileEvent, FileChangeEvent
│   └── worker.ts
│       └── runWatch(payload) — @parcel/watcher, emits watch:change, watch:ready
│
├── thread-pool/
│   ├── index.ts
│   │   └── runWorker(worker, payload) — Piscina worker by name
│   │   └── shutdown()
│   │   └── formatMb, logProcessMemory, initMemoryLogging, getPool()
│   ├── workers.ts
│   │   └── WORKERS — Map name → dist path (from manifest)
│   │   └── WorkerName type
│   ├── utils.ts
│   │   └── resolveWorkerUrl(relativeDistPath)
│   └── manifest.json
│       └── virtual, system, packager, packager-ts, watch → worker paths
│
├── virtual/
│   ├── index.ts
│   │   └── Re-exports: initVirtual, syncVirtual, transformFile, copyToVirtual, removeFromVirtual
│   ├── init.ts
│   │   └── initVirtual(sourceDir, config, options) — Runs virtual worker
│   ├── types.ts
│   │   └── InitVirtualOptions, VirtualOptions, TransformOptions, TransformResult
│   ├── worker.ts
│   │   └── runVirtual — Re-export for thread-pool
│   ├── run.ts
│   │   └── VirtualWorkerPayload
│   │   └── runVirtual(payload) — Initial copy; watchMode: listen watch:change → emit virtual:fs:change
│   │   └── startWatchMode(context)
│   ├── sync.ts
│   │   └── syncVirtual(sourceDir, config, options) — One-time sync to virtual dir
│   ├── transform.ts
│   │   └── transformFile(options) — MDX→JSX, cva/css rewrites via applyTransforms
│   ├── copy.ts
│   │   └── copyToVirtual(...) — Copy/transform file to virtual
│   │   └── removeFromVirtual(...) — Delete file + transformed variants
│   │   └── fileContainsMarkers(filePath, markers) — Streaming marker check
│   ├── utils.ts
│   │   └── getVirtualPath(sourcePath, sourceDir, virtualDir) — Path with ext transform
│   ├── config.internal.ts
│   │   └── DEFAULT_VIRTUAL_DIR, TRANSFORM_EXTENSIONS, isTransformExtension
│   │   └── TRANSFORMED_EXTENSIONS, WATCHER_CONFIG, GLOB_CONFIG
│   ├── transforms/
│   │   ├── index.ts
│   │   │   └── applyTransforms(options) — Pipeline: MDX→JSX, cva/css rewrites
│   │   │   └── Re-exports mdxToJsx, rewriteCvaImports, rewriteCssImports
│   │   ├── mdx-to-jsx.ts
│   │   │   └── mdxToJsx(mdxContent, sourceFile) — @rspress/mdx-rs (Rust)
│   │   ├── rewrite-cva-imports.ts
│   │   │   └── rewriteCvaImports(...) — Native addon
│   │   └── rewrite-css-imports.ts
│   │       └── rewriteCssImports(...) — Native addon
│   └── native/
│       └── loader.ts
│           └── loadVirtualNative(), getVirtualNative()
│           └── VirtualNativeBinding — rewriteCssImports, rewriteCvaImports
│
├── packager/
│   ├── index.ts
│   │   └── initPackager(cwd, config, options) — Fire worker or await bundle
│   │   └── Re-exports: bundleAllPackages, bundlePackage, PACKAGES, REACT_PACKAGE
│   ├── packages.ts
│   │   └── PackageDefinition
│   │   └── REACT_PACKAGE, SYSTEM_PACKAGE, PACKAGES
│   ├── bundler.ts
│   │   └── writeIfChanged, bundleWithEsbuild, transformTypeScriptFile
│   │   └── copyDirRecursive, copyDirectories, createPackageContent
│   │   └── bundlePackage, getShortName, bundleAllPackages
│   │   └── ENABLE_REFERENCE_UI_SYMLINKS
│   └── worker.ts
│       └── runPackager(payload) — Bundle, emit packager:complete; watch: listen system:compiled
│       └── runPackagerCore, debounce
│
├── packager-ts/
│   ├── index.ts
│   │   └── runTsPackager(payload)
│   │   └── initTsPackager(cwd, config)
│   ├── types.ts
│   │   └── TsPackagerWorkerPayload
│   ├── config.ts
│   │   └── createTsConfig(options)
│   ├── build.ts
│   │   └── copyExistingDeclarations, updatePackageTypes
│   │   └── buildDeclarations(cwd, packages, config)
│   ├── compiler.ts
│   │   └── compileDeclarations(...) — npx tsdown --dts
│   └── worker.ts
│       └── Default export → runTsPackager
│
└── system/
    ├── index.ts
    │   └── initSystem(cwd, config, options)
    │   └── Re-exports: runEval, scanDirectories, runFiles, createBoxPattern, createPandaConfig, createFontSystem (from config)
    ├── worker.ts
    │   └── runSystem(payload) — Config + Panda codegen; watch: virtual:fs:change → config, styles.css → system:compiled
    │   └── runConfigOnly, runSystemCore, debounce
    │
    ├── config/                    # All Panda config extensions (panda, boxPattern, fontFace)
    │   ├── index.ts — Re-exports from panda, boxPattern, fontFace
    │   ├── utils/
    │   │   ├── index.ts
    │   │   └── deepMerge.ts — deepMerge(target, ...sources)
    │   ├── panda/
    │   │   ├── index.ts — extendPandaConfig, COLLECTOR_KEY, createPandaConfig
    │   │   ├── createPandaConfig.ts — Scan, bundle, write panda.config.ts
    │   │   ├── extendPandaConfig.ts — COLLECTOR_KEY, extendPandaConfig
    │   │   ├── initCollector.ts — globalThis[COLLECTOR_KEY] = []
    │   │   └── entryTemplate.ts — buildPandaEntryContent(options)
    │   ├── boxPattern/
    │   │   ├── index.ts — createBoxPattern, extendBoxPattern
    │   │   ├── createBoxPattern.ts — Scan pattern(), collect, generate box.ts
    │   │   ├── initCollector.ts — globalThis[BOX_PATTERN_COLLECTOR_KEY] = []
    │   │   ├── extendBoxPattern.ts — BOX_PATTERN_COLLECTOR_KEY, extendBoxPattern, getBoxPatternExtensions
    │   │   ├── collectEntryTemplate.ts — buildCollectEntryContent(options)
    │   │   └── generateBoxPattern.ts — generateBoxPatternContent(extensions)
    │   └── fontFace/
    │       ├── index.ts — createFontSystem, extendFontCollector, FontDefinition, etc.
    │       ├── createFontSystem.ts — Collect fonts.ts, generate font.ts
    │       ├── initCollector.ts — globalThis[FONT_COLLECTOR_KEY] = []
    │       ├── extendFontFace.ts — FONT_COLLECTOR_KEY, extendFontCollector, getFontDefinitions
    │       ├── collectEntryTemplate.ts — buildFontCollectEntryContent(options)
    │       └── generateFontSystem.ts — generateFontSystemContent(defs)
    │
    ├── eval/
    │   ├── index.ts
    │   │   └── runEval(coreDir, directories, baseFiles)
    │   │   └── Re-exports: REGISTERED_FUNCTIONS, isRegistered, scanDirectories, runFiles
    │   ├── runner.ts
    │   │   └── runFiles(filePaths, cwd) — Bundle + import, collect extendPandaConfig
    │   ├── scanner.ts
    │   │   └── scanDirectory(dir) — Files with REGISTERED_FUNCTIONS
    │   │   └── scanDirectories(dirs), scanForBoxExtensions(dirs)
    │   └── registry.ts
    │       └── REGISTERED_FUNCTIONS, RegisteredFunction, isRegistered
    │
    ├── collectors/
    │   ├── README.md — Documents collector layout; keys/createCollector inlined in extendPandaConfig (resolution)
    │   ├── index.ts — Re-exports runCollectScript
    │   └── runCollectScript.ts — mkdir .ref, write entry, microBundle, spawnSync, read JSON, rm temp
    └── gen/
        ├── runner.ts
        │   └── resolvePandaBin(), runPandaCodegen(cwd, options), runPandaCss(cwd)
        └── rewrite-cva-imports.example.md — Documents CVA/recipe transform (lives in virtual/transforms)
```

---

## Data Flow

```
main()
  └─ syncCommand
       ├─ loadUserConfig
       ├─ initEventBus, initLog
       └─ [sync path]
            ├─ initWatch (worker: watch)
            │     └─ emits: watch:ready, watch:change
            ├─ initVirtual (worker: virtual)
            │     └─ listens: watch:change → emits: virtual:fs:change
            ├─ initPackager (worker: packager)
            │     └─ listens: system:compiled → rebundles
            ├─ initSystem (worker: system)
            │     └─ listens: virtual:fs:change → runConfigOnly
            │     └─ emits: system:compiled
            └─ initTsPackager (worker: packager-ts)
```

---

## Not in Tree (Non-Code)

- Markdown: CLI.md, README files, build-plan.md, thread.md
- Rust/native: virtual/native/*.rs, Cargo.toml
- Config: manifest.json, package.json

---

## CLI Code Improvements

### Quick wins

- [x] **1. Extract `debounce` to lib/** — Duplicated in `packager/worker.ts` and `system/worker.ts`. Move to `lib/debounce.ts`.

- [x] **2. Extract `toRelativeImport` to lib/** — Same function in `entryTemplate.ts`, `boxPattern/collectEntryTemplate.ts`, `fontFace/collectEntryTemplate.ts`. Add `lib/path.ts`.

- [x] **6. Dead code: `copy-to-codegen.ts`** — Removed copy-to-codegen.ts and its only consumers (system/gen mdx-to-jsx, rewrite-cva-imports, rewrite-css-imports). Virtual approach uses native transforms.

### Collector + collect-script (do in order; 3 and 4 are coupled)


- [x] **3a. `runCollectScript<T>(options)`** — Extracted to `system/collectors/runCollectScript.ts`.

- [x] **3b. Migrate `createBoxPattern`** — Uses `runCollectScript`.

- [x] **3c. Migrate `createFontSystem`** — Uses `runCollectScript`.

### Structural

- [ ] **5. `resolveCorePackageDir` consistency** — Workers in `packager` and `system` call `resolveCorePackageDir()` with no args. Pass project root from payload everywhere.

### Polish / documentation

- [ ] **7. Document virtual transforms** — `virtual/transforms/` does MDX→JSX and import rewrites via native addon. Document the approach.

- [ ] **8. Worker entry boilerplate** — Each worker has `worker.ts` → default export `runX`. Document the pattern or simplify.

- [ ] **9. Base worker payload type** — `WatchPayload`, `VirtualWorkerPayload`, `PackagerWorkerPayload`, etc. Could share `{ cwd: string; config: ReferenceUIConfig }` base.
