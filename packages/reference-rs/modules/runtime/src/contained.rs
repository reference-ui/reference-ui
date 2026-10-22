//! Containment for every N-API export: each call's body runs on its own large-stack thread.
//! A panic there returns as a `napi::Error` instead of aborting Node, and deep input recursion overflows
//! a 256 MiB reservation rather than the Node main thread. Each call gets fresh thread-locals, so no state
//! from one request leaks into the next. `run` takes the export's name, the stack size, and the body.
//! A thread the OS refuses to start (strict overcommit or a tight ulimit) retries at half the stack, down to
//! `STACK_FLOOR`; the error that finally comes back names the last size tried.

use std::any::Any;
use std::io;
use std::sync::{Arc, Mutex, PoisonError};
use std::thread::{Builder, Scope, ScopedJoinHandle};

use napi::{Error, Result};

/// Stack reserved for one export call. It is virtual memory, committed only as deep recursion touches it.
pub const NATIVE_STACK: usize = 256 << 20;

/// Smallest stack a refused start retries at. Halving stops here, so a start refused at this size is reported. It is 16 MiB
/// because the nesting gate's backstops allow 8,192 levels, which Oxc needs up to 16 MiB to recurse through.
const STACK_FLOOR: usize = 16 << 20;

/// Runs `body` on a new thread with `stack` bytes of stack and joins it before returning. A panic in the
/// body becomes `native panic in <name>: <payload>`; a thread the OS refuses to start is retried smaller
/// and, if every size is refused, becomes an error.
pub fn run<T: Send>(
    name: &str,
    stack: usize,
    body: impl FnOnce() -> Result<T> + Send,
) -> Result<T> {
    std::thread::scope(|scope| {
        let worker =
            spawn_with_fallback(scope, stack, || Builder::new().name(name.to_owned()), body)
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

/// Spawns `body` inside `scope` with `stack` bytes, retrying each refusal at half the size until the floor.
/// The body is parked in a shared slot, because a refused start drops its closure unrun.
fn spawn_with_fallback<'scope, 'env, T: Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    stack: usize,
    builder: impl Fn() -> Builder,
    body: impl FnOnce() -> T + Send + 'scope,
) -> io::Result<ScopedJoinHandle<'scope, T>> {
    let parked = Arc::new(Mutex::new(Some(body)));
    let mut size = stack;
    loop {
        let source = match start_parked(scope, &builder, size, &parked) {
            Ok(handle) => return Ok(handle),
            Err(source) => source,
        };
        size = next_size(size).ok_or_else(|| named(source, size))?;
    }
}

/// Half of `size` while that stays at or above `STACK_FLOOR`; `None` once the floor was tried.
fn next_size(size: usize) -> Option<usize> {
    (size / 2 >= STACK_FLOOR).then_some(size / 2)
}

/// One start at `size`. Its closure takes the parked body on the new thread, so a refused start leaves
/// the body in the slot for the next size.
fn start_parked<'scope, 'env, T: Send + 'scope, F: FnOnce() -> T + Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    builder: &impl Fn() -> Builder,
    size: usize,
    parked: &Arc<Mutex<Option<F>>>,
) -> io::Result<ScopedJoinHandle<'scope, T>> {
    let slot = Arc::clone(parked);
    start_thread(scope, builder, size, move || take_and_run(&slot))
}

/// Takes the parked body and runs it on the thread whose start succeeded. Only that thread ever takes it,
/// so the slot is still full when the closure runs.
fn take_and_run<F: FnOnce() -> T, T>(slot: &Mutex<Option<F>>) -> T {
    let parked = slot.lock().unwrap_or_else(PoisonError::into_inner).take();
    match parked {
        Some(body) => body(),
        None => unreachable!("a parked body is taken once, by the thread that started"),
    }
}

/// One OS spawn at `stack` bytes. Under test a switch can refuse it before the OS is asked.
fn start_thread<'scope, 'env, T: Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    builder: &impl Fn() -> Builder,
    stack: usize,
    body: impl FnOnce() -> T + Send + 'scope,
) -> io::Result<ScopedJoinHandle<'scope, T>> {
    #[cfg(test)]
    if test_refusal(stack) {
        return Err(io::Error::new(
            io::ErrorKind::OutOfMemory,
            "injected refusal",
        ));
    }
    builder().stack_size(stack).spawn_scoped(scope, body)
}

/// Keeps the refusal's kind and says which stack was the last one tried.
fn named(source: io::Error, stack: usize) -> io::Error {
    io::Error::new(
        source.kind(),
        format!("{source} (last stack tried: {} MiB)", stack >> 20),
    )
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
std::thread_local! {
    /// Stack size of each spawn attempt on this thread, in order (tests only).
    static ATTEMPTS: std::cell::RefCell<Vec<usize>> = const { std::cell::RefCell::new(Vec::new()) };
    /// Spawn attempts left to refuse on this thread (tests only).
    static REFUSALS: std::cell::Cell<usize> = const { std::cell::Cell::new(0) };
}

/// Logs one attempt and reports whether the test switch refuses it.
#[cfg(test)]
fn test_refusal(stack: usize) -> bool {
    ATTEMPTS.with(|log| log.borrow_mut().push(stack));
    REFUSALS.with(|left| {
        let before = left.get();
        left.set(before.saturating_sub(1));
        before > 0
    })
}

/// Arms the test switch: the next `refusals` attempts on this thread are refused, and the attempt log starts empty.
#[cfg(test)]
fn arm_spawn_switch(refusals: usize) {
    REFUSALS.with(|left| left.set(refusals));
    ATTEMPTS.with(|log| log.borrow_mut().clear());
}

/// Stack sizes tried on this thread since the switch was armed, in order (tests only).
#[cfg(test)]
fn take_spawn_attempts() -> Vec<usize> {
    ATTEMPTS.with(|log| std::mem::take(&mut *log.borrow_mut()))
}

#[cfg(test)]
mod tests {
    use super::*;

    const MIB: usize = 1 << 20;

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

    #[test]
    fn a_refused_start_retries_at_quarter_stack() {
        arm_spawn_switch(2);
        match run("probe", NATIVE_STACK, || Ok(7u8)) {
            Ok(value) => assert_eq!(value, 7),
            Err(err) => panic!("two refusals should retry and run: {}", err.reason),
        }
        assert_eq!(take_spawn_attempts(), [256 * MIB, 128 * MIB, 64 * MIB]);
    }

    #[test]
    fn a_start_refused_at_every_size_names_the_floor() {
        arm_spawn_switch(usize::MAX);
        match run("probe", NATIVE_STACK, || Ok(7u8)) {
            Ok(value) => panic!("a refused start ran the body: {value}"),
            Err(err) => assert!(
                err.reason.contains("last stack tried: 16 MiB"),
                "{}",
                err.reason
            ),
        }
        assert_eq!(
            take_spawn_attempts(),
            [256 * MIB, 128 * MIB, 64 * MIB, 32 * MIB, 16 * MIB]
        );
    }

    #[test]
    fn a_start_that_succeeds_is_not_retried() {
        arm_spawn_switch(0);
        match run("probe", NATIVE_STACK, || Ok(7u8)) {
            Ok(value) => assert_eq!(value, 7),
            Err(err) => panic!("a start the OS accepts failed: {}", err.reason),
        }
        assert_eq!(take_spawn_attempts(), [256 * MIB]);
    }
}
