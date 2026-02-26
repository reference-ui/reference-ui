# reference-test Architecture

High-level architecture for the end-to-end testing framework. See **plan.md** for philosophy and scope (what we're testing).

---

## Philosophy

**We test the output, not the CLI.** The CLI is a means to an end. We verify that config → sync → build → render produces the expected CSS and styles. Black-box: we don't care about internal pipeline mechanics.

---

## Core Concept

**ONE comprehensive test** that validates the entire design system workflow:

1. User defines tokens/fonts/keyframes in `ui.config.ts`
2. Runs `ref sync` to generate styled-system
3. Builds app with bundler
4. Renders in browser with correct styles
5. **Simulates developer workflow**: Modifies `ui.config.ts` file while watch mode is running
6. Observes changes propagate to the browser (HMR or reload)

This **single test runs across a matrix** of environments (React 18/19, Vite 5/6, Webpack, etc.) to ensure the design system works everywhere.

The browser is only used for **style inspection** (querying computed CSS values). All "user interaction" is file-system based—editing config files to simulate a developer's workflow.

---

## Design Principles

### Clean Code Foundation

This codebase must be **architected correctly from day one** to avoid future refactoring:

**SOLID Principles**

- **Single Responsibility**: Each module has exactly one reason to change
- **Open/Closed**: Extensible for new bundlers/frameworks without modifying core
- **Liskov Substitution**: All environment implementations are interchangeable
- **Interface Segregation**: Small, focused contracts
- **Dependency Inversion**: Core logic depends on abstractions, not implementations

**Clean Architecture Layers**

- **Orchestrator**: Entry point that runs the matrix, coordinates test flow
- **Services**: Business logic (project generation, runner operations, assertions)
- **Adapters**: External system adapters (runner wraps processes, utils wraps file system, browser wraps Playwright)

**Code Quality Standards**

- Immutability by default
- Pure functions where possible
- Explicit naming, no magic values
- Comprehensive error handling
- Strong TypeScript typing
- Independent module testability
- JSDoc for all public APIs

---

## Tech Stack

- **Vitest**: Test runner with matrix support
- **Playwright**: Browser automation and style inspection
- **execa**: Process management (CLI, dev servers)
- **fs-extra**: File system operations
- **tree-kill**: Process tree cleanup
- **get-port**: Dynamic port allocation
- **wait-port**: Server readiness detection
- **chokidar**: File watching for rebuild signals
- **debug**: Structured logging

---

## High-Level Architecture

### The Test Flow

```
Matrix Configuration (React version × Bundler × Bundler version)
  ↓
Environment Setup (create project in temp dir for specific combo)
  ↓
Initial Test Phase (define config → sync → build → render → assert styles)
  ↓
Developer Workflow Simulation (modify config file while watch mode active)
  ↓
Watch Mode Validation (detect rebuild → query styles → verify changes)
  ↓
Cleanup (tear down servers, processes, temp directories)
```

### Project Generation Strategy

**Dynamic project creation**: For each matrix combination, we programmatically create a fresh project in a temp directory with:

- Correct React version
- Correct bundler and version
- Minimal app that uses the design system
- Test fixture `ui.config.ts` with tokens/fonts/keyframes
- Bundler configuration

**No pre-built templates**—we generate everything on-the-fly based on the matrix parameters. This gives us:

- Full control over each environment
- Ability to test exact version combinations
- Isolation between test runs
- Flexibility to add new environments

### MVP Focus

**Most complexity is in scaffolding virtual environments**—project generation, runner, process lifecycle, cleanup—not in asserting CSS. The MVP scaffolds the full structure and does the bare minimum to prove it works: **Vite + React 18 only**. One matrix entry. One token assertion. No watch mode yet. Once the infrastructure is solid and cleanly written, expanding (more combos, fonts, keyframes, watch mode) is straightforward. Prioritize **clean code**—well-structured, readable, maintainable from the start.

---

## Folder Structure

```
packages/reference-test/
├── src/
│   ├── index.ts                    # Public API exports
│   │
│   ├── project/                    # Complete project generation
│   │   ├── index.ts
│   │   ├── generator.ts           # Main generateProject(config) function
│   │   ├── dependencies.ts        # Version resolution (React, bundler versions)
│   │   ├── app-builder.ts         # Generates React app files
│   │   ├── types.ts                # Project config interfaces
│   │   │
│   │   ├── bundlers/               # Bundler implementations
│   │   │   ├── index.ts
│   │   │   ├── bundler-interface.ts
│   │   │   ├── vite.ts
│   │   │   ├── webpack.ts
│   │   │   └── rollup.ts
│   │   │
│   │   └── test-configs/           # Standard test configurations
│   │       ├── index.ts
│   │       ├── tokens.ts          # Token configurations (minimal, complex)
│   │       ├── fonts.ts           # Font configurations
│   │       ├── keyframes.ts       # Animation configurations
│   │       └── types.ts
│   │
│   ├── runner/                     # Test runner for generated projects
│   │   ├── index.ts
│   │   ├── runner.ts              # Main Runner class - runs a generated project
│   │   ├── commands.ts            # Command execution (sync, build, dev)
│   │   ├── dev-server.ts          # Dev server lifecycle management
│   │   ├── watch-manager.ts       # Watch mode management
│   │   ├── file-operations.ts    # Hooks: updateFile(), readFile(), etc.
│   │   ├── rebuild-detector.ts    # Detects when rebuilds complete
│   │   ├── port-manager.ts        # Port allocation and tracking
│   │   ├── process-manager.ts     # Process lifecycle (spawn, kill, track)
│   │   ├── cleanup.ts             # Resource cleanup coordination
│   │   └── types.ts                # Runner interfaces
│   │
│   ├── browser/                    # Browser automation (style inspection only)
│   │   ├── index.ts
│   │   └── browser.ts             # Minimal Playwright wrapper for style queries
│   │
│   ├── assertions/                 # Test assertions
│   │   ├── index.ts
│   │   ├── styles.ts              # Computed style verifications
│   │   ├── dom.ts                 # DOM structure verifications
│   │   ├── build.ts               # Build output verifications
│   │   └── files.ts               # Generated file verifications
│   │
│   ├── orchestrator/               # Entry point - runs matrix, coordinates test flow
│   │   ├── index.ts
│   │   ├── orchestrator.ts        # Creates projects from matrix, runs tests
│   │   ├── test-context.ts        # Shared test state management
│   │   └── matrix/                # Environment combinations to test
│   │       ├── index.ts
│   │       ├── matrix-config.ts   # Matrix definitions
│   │       └── variants.ts        # All supported combinations
│   │
│   ├── utils/                      # Shared utilities
│   │   ├── index.ts
│   │   ├── file-system.ts         # File operations (used by project + runner)
│   │   └── logger.ts              # Structured logging
│   │
│   └── tests/                      # Pure Vitest tests - use project, runner, browser, assertions, orchestrator
│       └── core-system.test.ts   # The ONE comprehensive test suite
│
├── plan.md                         # What we're testing (philosophy, scope)
├── architecture.md                 # How we're building it (this file)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Module Descriptions

### project/

**Purpose**: Complete project generation - the only entry point for creating test environments.

**generator.ts**

- `generateProject(config)`: Main function that creates complete test project
- Coordinates: dependency resolution → bundler setup → app generation → config creation
- Returns project handle with root path and cleanup function
- All-in-one: handles React versions, bundlers, test configurations

**dependencies.ts**

- `resolveDependencies(config)`: Maps config to exact package versions
- React 18 → 18.3.1, React 19 → 19.0.0
- Vite 5 → 5.4.0, Vite 6 → 6.0.0
- Handles peer dependencies and compatibility

**app-builder.ts**

- `buildApp(config)`: Generates React app files (App.tsx, index.html, main.tsx)
- Different variants based on test config (tokens, fonts, keyframes, comprehensive)
- Pure programmatic generation, no templates

**bundlers/ (nested folder)**

- `bundler-interface.ts`: Defines Bundler interface
- `vite.ts, webpack.ts, rollup.ts`: Bundler-specific implementations
- Each bundler knows how to: configure itself, run build, start dev server

**test-configs/ (nested folder)**

- Standard token/font/keyframe configurations for testing
- `tokens.ts`: Minimal (colors, spacing), Complex (nested, responsive)
- `fonts.ts`: Custom font families, weights, styles
- `keyframes.ts`: Animation definitions
- Part of the generator - used when creating ui.config.ts

### runner/

**Purpose**: Test harness for running operations on a generated project. The Runner is the interface between tests and the project.

**runner.ts**

- `Runner` class: Main interface for operating on a generated project
- `run()`: Executes the project (sync, build, start dev server)
- `runSync()`: Execute ref sync command
- `runBuild()`: Execute build command
- `runDev()`: Start dev server
- `startWatch()`: Start watch mode
- `stopWatch()`: Stop watch mode
- `updateFile(path, changes)`: Modify a file (simulates developer editing)
- `readFile(path)`: Read file contents
- `waitForRebuild()`: Wait for watch mode to complete rebuild
- `getBrowserURL()`: Get dev server URL
- `cleanup()`: Tear down all processes and resources

**commands.ts**

- Command execution logic (wraps CLI commands)
- `executeSync(projectRoot)`: Run ref sync
- `executeBuild(projectRoot, bundler)`: Run bundler build
- `executeDevServer(projectRoot, bundler, port)`: Start dev server
- Error handling and output capture

**dev-server.ts**

- Dev server lifecycle management
- `startServer(projectRoot, bundler, port)`: Starts dev server process
- `stopServer(process)`: Gracefully stops server
- `waitForReady(url)`: Polls until server responds
- Bundler-agnostic interface

**watch-manager.ts**

- Watch mode process management
- `startWatchMode(projectRoot)`: Starts watch process in background
- `stopWatchMode(process)`: Stops watch process
- Manages process lifecycle

**file-operations.ts**

- File manipulation hooks for tests
- `updateFile(path, search, replace)`: Atomic file modification
- `appendToFile(path, content)`: Append content
- `replaceFileContent(path, newContent)`: Replace entire file
- `readFile(path)`: Read file contents
- All operations are atomic to avoid race conditions

**rebuild-detector.ts**

- Detects when watch mode completes a rebuild
- `waitForRebuild(watchProcess)`: Waits for rebuild completion
- Strategies: stdout parsing, file watching, polling
- Timeout handling

**port-manager.ts**

- Port allocation and tracking
- `allocatePort()`: Finds available port
- `releasePort(port)`: Marks port as available
- Prevents conflicts in parallel tests

**process-manager.ts**

- Process lifecycle management (wraps execa)
- `spawn()`, `exec()`: Execute processes
- `kill()`, `killTree()`: Terminate processes and children
- Tracks all spawned processes for cleanup

**cleanup.ts**

- Coordinates cleanup of runner resources
- Tracks: processes, dev server, watch mode, ports
- Ensures cleanup even on test failure
- Called by `runner.cleanup()`

### browser/

**Purpose**: Minimal browser wrapper for style inspection only.

**browser.ts**

- `launchBrowser()`: Starts Playwright browser instance
- `navigateTo(url)`: Opens page and waits for load
- `queryComputedStyle(selector, property)`: Gets computed CSS value
- `queryCSSVariable(name)`: Gets CSS custom property value
- `close()`: Cleanup browser instance

No complex interactions needed - developer workflow is simulated via runner's file operations.

### assertions/

**Purpose**: Verification functions for different test aspects.

**styles.ts**

- `assertColor(element, expected)`: Verifies computed color
- `assertFont(element, expected)`: Verifies font-family
- `assertAnimation(element, expected)`: Verifies keyframe animation
- `assertCSSVariable(name, expected)`: Verifies CSS custom property

**dom.ts**

- `assertClassApplied(element, pattern)`: Verifies CSS classes
- `assertElementExists(selector)`: Verifies DOM structure
- `assertAttribute(element, name, value)`: Verifies attributes

**build.ts**

- `assertFilesGenerated(projectRoot)`: Verifies styled-system/ exists
- `assertTypeScriptCompiles(projectRoot)`: Runs tsc --noEmit
- `assertBundleCreated(projectRoot)`: Verifies build output

**files.ts**

- `assertFileExists(path)`: Verifies file presence
- `assertFileContains(path, content)`: Verifies file content
- `assertCSSGenerated(projectRoot)`: Verifies CSS files

### utils/

**Purpose**: Shared utilities used across modules.

**file-system.ts**

- Wraps fs-extra with convenient operations
- `createTempDir()`, `writeFile()`, `readFile()`, `copyFile()`, `removeDir()`, etc.
- Used by both project generator (creating files) and runner (file operations)
- Consistent error handling

**logger.ts**

- Structured logging using debug library
- Different log levels: debug, info, warn, error
- Context-aware logging (test ID, phase, environment)
- Used throughout the codebase

### orchestrator/

**Purpose**: Entry point for test execution. Runs the matrix, coordinates project generation and test flow.

**orchestrator.ts**

- Iterates over matrix (via `test.each`)
- For each combination: generate project → create Runner → run core test suite → cleanup
- Coordinates the full test lifecycle

**test-context.ts**

- Shared test state management
- Tracks active runners, browser instances
- Coordinates cleanup on failure

**matrix/** (nested)

- `matrix-config.ts`: Defines all environment combinations (React × bundler × version)
- `variants.ts`: Version mappings for each environment

### tests/

**Purpose**: Pure Vitest test files. Import and use project, runner, browser, assertions, orchestrator.

**core-system.test.ts**

- The comprehensive test suite
- Receives Runner instance from orchestrator
- Executes: sync → build → render → assert → watch → modify → assert
- Reused across all matrix configurations

---

## The Test Flow

```
Matrix Configuration
  ↓
Orchestrator iterates over matrix (test.each)
  ↓
For each matrix entry:
  ├─ Generate Project (project module)
  ├─ Create Runner instance
  ├─ Run core test suite (src/tests/core-system.test.ts)
  │   ├─ Initial: sync → build → render → assert styles
  │   └─ Watch: modify file → rebuild → query → assert
  └─ Cleanup (runner + project)
```

**Core test suite** (`src/tests/core-system.test.ts`): Receives a `Runner` instance. Phase 1—`runner.runSync()`, verify styled-system/, `runner.runDev()`, open browser, assert computed styles. Phase 2—`runner.startWatch()`, `runner.updateFile('ui.config.ts', change)`, `runner.waitForRebuild()`, assert new styles. Phase 3—`runner.cleanup()`. Same suite runs for every matrix configuration.

**Orchestrator** (`src/orchestrator/`): Uses `test.each(matrix)` to generate project, create Runner, invoke core suite, cleanup. Matrix defines React × bundler × version. Test-context tracks runners/browser and coordinates cleanup on failure.

---

## Key Design Decisions

### Why a Runner Module?

The Runner is the **interface between tests and projects**:

- **Single API**: All project operations through one object
- **Encapsulation**: Hides CLI, server, file system complexity
- **Reusability**: Same runner works for any generated project
- **Testability**: Runner can be mocked for testing assertions
- **Clean separation**: Tests don't know about processes, ports, or file systems

**Before (scattered):**

```
generateProject() → runCLI() → startServer() → modifyFile() → waitForRebuild()
```

**After (unified):**

```
project = generateProject()
runner = new Runner(project)
runner.runSync() → runner.runDev() → runner.updateFile() → runner.waitForRebuild()
```

### Why One `project/` Module?

Consolidating environment setup into a single module:

- **Single entry point**: `generateProject(config)` handles everything
- **Co-located concerns**: Bundlers, React versions, test configs all in one place
- **Easier to reason about**: All generation logic unified
- **Simpler dependencies**: No complex coordination between multiple factories
- **Clean interface**: Config in → project out

### Separation of Concerns

Each layer has clear responsibilities:

- **Orchestrator** runs the matrix, creates projects and runners, executes core test suite
- **Runner** provides unified interface to project operations (uses process-manager, cleanup)
- **project/** handles environment generation (React, bundlers, configs)
- **browser/** provides style inspection interface
- **assertions/** verify test outcomes
- **utils/** provides shared utilities (file-system, logger)

This means:

- Easy to add new bundlers (just update project/)
- Easy to add new operations (just update runner/)
- Tests don't change when implementation details change
- Clear boundaries and contracts

---

## Error Handling Strategy

### Graceful Degradation

- All operations have timeouts
- Partial cleanup on failure (clean up what we can)
- Detailed error context (which phase, which environment)

### Resource Tracking

- Cleanup manager tracks everything allocated
- At-exit hooks ensure cleanup runs
- Leaked resource detection (log warnings)

### Error Context

Every error includes:

- Test phase (setup/sync/build/render/watch/cleanup)
- Environment configuration (React version, bundler, etc.)
- Project path for debugging
- Relevant logs and output

---

## Testing Strategy

### Unit Tests

Each module has unit tests:

- `project/dependencies.test.ts`: Version resolution logic
- `project/bundlers/vite.test.ts`: Bundler implementation
- `runner/file-operations.test.ts`: File modification logic
- `runner/process-manager.test.ts`: Process lifecycle
- etc.

### Integration Tests

Test module combinations:

- Project generator + file system
- Runner + process manager
- Browser + style assertions
- Runner + cleanup manager

### End-to-End Test

The core system test itself (src/tests/core-system.test.ts) - the comprehensive test that validates the entire workflow.

---

## CI Integration

### GitHub Actions Workflow

- Matrix sharding for parallel execution
- Artifact collection on failure (screenshots, logs, project dumps)
- Playwright trace collection
- Test result reporting

### Optimization

- Cache dependencies between runs
- Parallel test execution where safe
- Sequential execution for resource-intensive Playwright tests
- Fail-fast on first failure (optional)

---

## Future Extensibility

### Adding New Bundlers

1. Implement Bundler interface in `project/bundlers/`
2. Add to the bundler selection logic in `project/generator.ts`
3. Add version mappings to `src/orchestrator/matrix/variants.ts`
4. Add to matrix config - done!

### Adding New Test Configurations

1. Define configuration in `project/test-configs/` (tokens, fonts, keyframes)
2. Update `project/app-builder.ts` to use the new config
3. Add to matrix config if needed - done!

### Adding New Assertions

1. Add assertion function to appropriate module in `assertions/`
2. Use in tests - done!

### Adding New File Operations

1. Add operation method to `Runner` class
2. Use in test - done!

The architecture is designed for easy extension without modifying existing code (Open/Closed principle).

---

## Dependencies

```json
{
  "dependencies": {
    "execa": "^9.0.0",
    "fs-extra": "^11.2.0",
    "chokidar": "^4.0.0",
    "get-port": "^7.1.0",
    "wait-port": "^1.1.0",
    "tree-kill": "^1.2.2",
    "debug": "^4.3.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "playwright": "^1.48.0",
    "vitest": "^2.1.0",
    "typescript": "^5.6.0"
  }
}
```

---

## Next Steps

**MVP: Scaffold everything, bare minimal. Vite + React 18 only. Focus on clean code.**

1. **Create folder structure**: Set up all directories according to the spec
2. **Define interfaces**: Type definitions for all contracts (Project config, Bundler, etc.)
3. **Implement utils module**: file-system.ts (fs-extra wrapper), logger.ts (debug wrapper)
4. **Implement project module**:
   - generator.ts, dependencies.ts
   - Vite bundler only
   - Minimal test-config (one token)
   - Basic app-builder
5. **Implement runner module**:
   - dev(), build() via process-manager
   - File operations, cleanup manager
6. **Implement browser module**: Minimal Playwright wrapper for style queries
7. **Implement assertions**: Bare minimum (one style assertion)
8. **Implement orchestrator**: orchestrator.ts, test-context.ts, matrix with single entry (React 18 + Vite)
9. **Write core test**: core-system.test.ts—sync → build → render → assert one token. That's it.
10. **CI integration**: GitHub Actions workflow
