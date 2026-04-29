import { CONSUMER_DIR_IN_CONTAINER } from '../../../../config.js'

// Cache-key env var for the fixture-local /consumer/node_modules volume.
export const MATRIX_INSTALL_CACHE_KEY_ENV_VAR = 'REFERENCE_UI_MATRIX_INSTALL_CACHE_KEY'

// Cache-key env var for the graph-shared seed node_modules volume.
export const MATRIX_SHARED_INSTALL_CACHE_KEY_ENV_VAR = 'REFERENCE_UI_MATRIX_SHARED_INSTALL_CACHE_KEY'

// Uncached probe marker used to force Dagger cache probe execs to rerun.
export const MATRIX_INSTALL_CACHE_PROBE_ENV_VAR = 'REFERENCE_UI_DAGGER_UNCACHED_EXEC_PROBE'

// Marker file written into the fixture-local node_modules cache after install.
export const MATRIX_INSTALL_CACHE_MARKER_PATH = `${CONSUMER_DIR_IN_CONTAINER}/node_modules/.reference-ui-install-cache-key`

// pnpm state file used to verify the fixture-local node_modules tree is linked.
export const MATRIX_NODE_MODULES_STATE_PATH = `${CONSUMER_DIR_IN_CONTAINER}/node_modules/.modules.yaml`

// Mount point for the graph-shared seed cache volume inside the container.
export const MATRIX_SHARED_NODE_MODULES_ROOT_PATH = '/matrix-node-modules-shared'

// Marker file recording which install graph seeded the shared node_modules cache.
export const MATRIX_SHARED_INSTALL_CACHE_MARKER_PATH = `${MATRIX_SHARED_NODE_MODULES_ROOT_PATH}/.reference-ui-install-cache-key`

// Shared cache copy of node_modules used to hydrate cold fixture-local volumes.
export const MATRIX_SHARED_NODE_MODULES_PATH = `${MATRIX_SHARED_NODE_MODULES_ROOT_PATH}/node_modules`

// pnpm state file used to verify the shared seed node_modules tree is usable.
export const MATRIX_SHARED_NODE_MODULES_STATE_PATH = `${MATRIX_SHARED_NODE_MODULES_PATH}/.modules.yaml`