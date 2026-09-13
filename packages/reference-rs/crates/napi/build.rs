//! Cargo build script configuring native compilation for the Reference UI Node-API addon.
//! Invokes napi-build setup routines to link platform-specific Node-API headers and symbols.
//! Prepares shared library targets for cross-platform packaging and dynamic loading by Node runtimes.

fn main() {
    napi_build::setup();
}
