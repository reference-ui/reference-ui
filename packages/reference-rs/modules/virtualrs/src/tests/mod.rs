//! Test file.
//! This file provides coverage for the respective domain.
//! It inputs test cases and emits test results.

use std::collections::HashMap;

const VIRTUAL_PATH: &str = "src/virtualrs/example.tsx";

pub fn no_breakpoints() -> HashMap<String, String> {
    HashMap::new()
}

pub fn breakpoints(entries: &[(&str, &str)]) -> HashMap<String, String> {
    entries
        .iter()
        .map(|(name, width)| ((*name).to_string(), (*width).to_string()))
        .collect()
}

mod imports;
mod function_name;
mod responsive;
