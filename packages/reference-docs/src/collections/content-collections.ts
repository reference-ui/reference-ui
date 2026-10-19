// Content-collections config entrypoint (must live in this directory).
// It takes nothing and emits the one-line re-export of the real config. The watcher
// subscribes to the config file's directory, so a root-level entry would watch dist/.
export { default } from './index'
