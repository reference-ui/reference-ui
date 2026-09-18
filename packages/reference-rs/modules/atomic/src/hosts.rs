//! Explicit and traced JSX host resolution for StyleProps gating.
//! Unions caller-supplied `jsxHosts` with styletrace-traced component names so configured hosts and
//! generated primitives extract without a file-local import. The declaration root threads through as
//! styletrace's sync-root hint; an unavailable graph yields no names and extraction fails closed
//! with a missing-graph diagnostic (ATM-SITE-13), never a scan.

use std::collections::HashSet;
use std::path::Path;

use crate::CompileRequest;

/// Caller hosts plus traced names for one compile.
pub fn collect_hosts(request: &CompileRequest) -> HashSet<String> {
    let mut hosts = traced_names(request);
    hosts.extend(request.jsx_hosts.iter().flatten().cloned());
    hosts
}

fn traced_names(request: &CompileRequest) -> HashSet<String> {
    let Some(root) = request.root_dir.as_ref() else {
        return HashSet::new();
    };
    let decl = request.declaration_root.as_deref().map(Path::new);
    match styletrace::trace_style_jsx_names_with_hint(Path::new(root), decl) {
        Ok(names) => names.into_iter().collect(),
        Err(_) => HashSet::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{compile, BaseSystem, VirtualSource};

    fn host_request(jsx_hosts: Option<Vec<String>>) -> CompileRequest {
        CompileRequest {
            files: Some(vec![VirtualSource {
                path: "src/host.tsx".to_string(),
                content: "import { Div } from '@reference-ui/react'\n\
                    export const el = <ConfiguredHost mt=\"4r\" />\n\
                    void Div\n"
                    .to_string(),
            }]),
            base_system: BaseSystem::lib_fixture().clone(),
            jsx_hosts,
            ..CompileRequest::default()
        }
    }

    fn has_mt(wants: &[crate::Want], value: &str) -> bool {
        wants
            .iter()
            .any(|w| &*w.prop == "mt" && w.value.to_string() == value)
    }

    #[test]
    fn test_explicit_hosts_admit_unimported_tags() {
        let gated = compile(&host_request(None)).expect("compile succeeds");
        assert!(!has_mt(&gated.wants, "4r"));

        let admitted = compile(&host_request(Some(vec!["ConfiguredHost".to_string()])))
            .expect("compile succeeds");
        assert!(has_mt(&admitted.wants, "4r"));
        assert!(admitted.stylesheet.contains("mt_4r"));
    }

    #[test]
    fn test_empty_hosts_match_legacy_fields() {
        let legacy = compile(&host_request(None)).expect("compile succeeds");
        let empty = compile(&host_request(Some(Vec::new()))).expect("compile succeeds");
        assert_eq!(empty.stylesheet, legacy.stylesheet);
        assert_eq!(empty.wants, legacy.wants);
        assert_eq!(empty.diagnostics, legacy.diagnostics);
    }
}
