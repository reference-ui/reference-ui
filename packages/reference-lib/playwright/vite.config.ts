// CT gallery Vite config: Book's config under the selected React-major runtime.
// It takes nothing and emits withCtRuntime(bookConfig).
import bookConfig from '../book/vite.config'
import { withCtRuntime } from './runtimes/vite'

export default withCtRuntime(bookConfig)
