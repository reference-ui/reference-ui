//! Committed contract fixtures and serde validation for packet F0.
//! Embeds the frozen JSON wire contract fixtures for cross-crate test consumption.
//! Validates that EvaluatedSystemSpec, NativeRuntimeArtifact, and CompileResult fixtures
//! deserialize properly in Rust and fail closed on invalid versions or unexpected fields.
//! Provides shared contract definitions used across base-system, atomic, and typegen.

/// Raw JSON string of the positive EvaluatedSystemSpec fixture.
pub const EVALUATED_SYSTEM_SPEC_JSON: &str =
    include_str!("../../../../contracts/fixtures/evaluated-system-spec.json");

/// Raw JSON string of the token-light EvaluatedSystemSpec fixture.
pub const EVALUATED_SYSTEM_SPEC_TOKEN_LIGHT_JSON: &str =
    include_str!("../../../../contracts/fixtures/evaluated-system-spec-token-light.json");

/// Raw JSON string of the invalid schema version fixture.
pub const EVALUATED_SYSTEM_SPEC_INVALID_VERSION_JSON: &str =
    include_str!("../../../../contracts/fixtures/evaluated-system-spec-invalid-version.json");

/// Raw JSON string of the unknown top-level field fixture.
pub const EVALUATED_SYSTEM_SPEC_UNKNOWN_FIELD_JSON: &str =
    include_str!("../../../../contracts/fixtures/evaluated-system-spec-unknown-field.json");

/// Raw JSON string of the NativeRuntimeArtifact fixture.
pub const NATIVE_RUNTIME_ARTIFACT_JSON: &str =
    include_str!("../../../../contracts/fixtures/native-runtime-artifact.json");

/// Raw JSON string of the CompileResult fixture.
pub const COMPILE_RESULT_JSON: &str =
    include_str!("../../../../contracts/fixtures/compile-result.json");

/// Raw JSON string of the PortableBaseSystem fixture.
pub const PORTABLE_BASE_SYSTEM_JSON: &str =
    include_str!("../../../../contracts/fixtures/portable-base-system.json");

/// Raw JSON string of the NativeCompileRequest fixture.
pub const NATIVE_COMPILE_REQUEST_JSON: &str =
    include_str!("../../../../contracts/fixtures/native-compile-request.json");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fixtures_are_valid_json() {
        let spec_val: serde_json::Value =
            serde_json::from_str(EVALUATED_SYSTEM_SPEC_JSON).expect("valid evaluated spec JSON");
        assert_eq!(spec_val["schemaVersion"], 1);
        assert_eq!(spec_val["profile"], "reference-ui");
        assert_eq!(spec_val["name"], "lib-test-system");

        let runtime_val: serde_json::Value =
            serde_json::from_str(NATIVE_RUNTIME_ARTIFACT_JSON).expect("valid runtime JSON");
        assert_eq!(runtime_val["schemaVersion"], 1);

        let compile_val: serde_json::Value =
            serde_json::from_str(COMPILE_RESULT_JSON).expect("valid compile result JSON");
        assert!(compile_val["stylesheet"].is_string());

        let portable_val: serde_json::Value =
            serde_json::from_str(PORTABLE_BASE_SYSTEM_JSON).expect("valid portable system JSON");
        assert_eq!(portable_val["schemaVersion"], 1);

        let request_val: serde_json::Value =
            serde_json::from_str(NATIVE_COMPILE_REQUEST_JSON).expect("valid compile request JSON");
        assert_eq!(request_val["schemaVersion"], 1);
    }

    #[test]
    fn invalid_version_fixture_fails_check() {
        let val: serde_json::Value =
            serde_json::from_str(EVALUATED_SYSTEM_SPEC_INVALID_VERSION_JSON)
                .expect("valid JSON syntax");
        assert_ne!(val["schemaVersion"], 1);
    }

    #[test]
    fn unknown_field_fixture_has_extra_key() {
        let val: serde_json::Value =
            serde_json::from_str(EVALUATED_SYSTEM_SPEC_UNKNOWN_FIELD_JSON)
                .expect("valid JSON syntax");
        assert!(val.get("unexpectedProperty").is_some());
    }
}
