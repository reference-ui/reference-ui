import bookConfig from '../book/vite.config'
import { withCtRuntime } from './runtimes/vite'

export default withCtRuntime(bookConfig)
