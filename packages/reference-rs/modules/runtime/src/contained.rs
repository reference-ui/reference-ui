//! Containment for every N-API export: each call's body runs on its own large-stack thread.
//! A panic there returns as a `napi::Error` instead of aborting Node, and deep input recursion overflows
//! a 256 MiB reservation rather than the Node main thread. Each call gets fresh thread-locals, so no state
//! from one request leaks into the next. `run` takes the export's name, the stack size, and the body.

use std::any::Any;

use napi::{Error, Result};

/// Stack reserved for one export call. It is virtual memory, committed only as deep recursion touches it.
pub const NATIVE_STACK: usize = 256 << 20;

/// Runs `body` on a new thread with `stack` bytes of stack and joins it before returning. A panic in the
/// body becomes `native panic in <name>: <payload>`; a thread the OS refuses to start is an error too.
pub fn run<T: Send>(
    name: &str,
    stack: usize,
    body: impl FnOnce() -> Result<T> + Send,
) -> Result<T> {
    std::thread::scope(|scope| {
        let worker = std::thread::Builder::new()
            .name(name.to_owned())
            .stack_size(stack)
            .spawn_scoped(scope, body)
            .map_err(|err| {
                Error::from_reason(format!("native thread for {name} did not start: {err}"))
            })?;
        worker.join().unwrap_or_else(|payload| {
            Err(Error::from_reason(format!(
                "native panic in {name}: {}",
                payload_text(&*payload)
            )))
        })
    })
}

/// The text of a panic payload: `panic!` produces a `&str` or a `String`, anything else gets a placeholder.
fn payload_text(payload: &(dyn Any + Send)) -> &str {
    payload
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| payload.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("unknown panic payload")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_panic_in_the_body_returns_an_error_naming_it() {
        let outcome: Result<u8> = run("probe", NATIVE_STACK, || panic!("lane exploded"));
        match outcome {
            Ok(value) => panic!("a panicking body returned {value}"),
            Err(err) => assert_eq!(err.reason, "native panic in probe: lane exploded"),
        }
    }

    #[test]
    fn a_deep_recursion_fits_the_native_stack() {
        fn depth(frames: u32) -> u32 {
            let frame = [frames as u8; 512];
            std::hint::black_box(&frame);
            if frames == 0 {
                0
            } else {
                1 + depth(frames - 1)
            }
        }
        match run("deep", NATIVE_STACK, || Ok(depth(50_000))) {
            Ok(value) => assert_eq!(value, 50_000),
            Err(err) => panic!("deep recursion failed: {}", err.reason),
        }
    }
}
