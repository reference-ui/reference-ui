//! Include-glob scoping for atomic source discovery (case ATM-SCAN-01).
//! The matcher, the glob automaton and the directory state live in `shared::includes`; this module re-exports that
//! scope so every `crate::includes` path keeps resolving. Its tests pin the compile contract: an include list scopes
//! the virtual files and the disk scan of one request, and an open list keeps every legacy file.

pub use shared::includes::{FileMatcher, IncludeScope};
pub(crate) use shared::includes::normalize_candidate;

#[cfg(test)]
mod tests {
    fn scoped_request(include: Option<Vec<String>>) -> crate::CompileRequest {
        crate::CompileRequest {
            files: Some(vec![
                crate::VirtualSource {
                    path: "theme/in.ts".to_string(),
                    content: "import { css } from '@reference-ui/react'\n\
                        export const a = css({ color: 'red.500' })\n"
                        .to_string(),
                },
                crate::VirtualSource {
                    path: "outside/out.ts".to_string(),
                    content: "import { css } from '@reference-ui/react'\n\
                        export const b = css({ color: 'blue.500' })\n"
                        .to_string(),
                },
            ]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            include,
            logs: Some(vec!["proof".to_string()]),
            ..crate::CompileRequest::default()
        }
    }

    fn has_color(wants: &[crate::Want], value: &str) -> bool {
        wants
            .iter()
            .any(|want| &*want.prop == "color" && want.value.to_string() == value)
    }

    #[test]
    fn include_scopes_virtual_files() {
        let scoped = crate::compile(&scoped_request(Some(vec!["theme/**".to_string()])))
            .expect("compile succeeds");
        assert!(has_color(&scoped.wants, "red.500"));
        assert!(!has_color(&scoped.wants, "blue.500"));
        assert!(scoped.diagnostics.is_empty());
    }

    #[test]
    fn open_include_keeps_legacy_files() {
        let all = crate::compile(&scoped_request(None)).expect("compile succeeds");
        assert!(has_color(&all.wants, "red.500"));
        assert!(has_color(&all.wants, "blue.500"));
        let empty = crate::compile(&scoped_request(Some(Vec::new()))).expect("compile succeeds");
        assert_eq!(empty.wants, all.wants);
        assert_eq!(empty.stylesheet, all.stylesheet);
    }

    #[test]
    fn include_scopes_disk_scan() {
        let root = std::env::temp_dir().join(format!("atomic_include_{}_scan", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("theme")).expect("create theme dir");
        std::fs::create_dir_all(root.join("outside")).expect("create outside dir");
        std::fs::write(
            root.join("theme/in.ts"),
            "import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red.500' })\n",
        )
        .expect("write in.ts");
        std::fs::write(
            root.join("outside/out.ts"),
            "import { css } from '@reference-ui/react'\nexport const b = css({ color: 'blue.500' })\n",
        )
        .expect("write out.ts");

        let request = crate::CompileRequest {
            root_dir: Some(root.to_string_lossy().to_string()),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            include: Some(vec!["theme/**".to_string()]),
            logs: Some(vec!["proof".to_string()]),
            ..crate::CompileRequest::default()
        };
        let scoped = crate::compile(&request).expect("compile succeeds");
        assert!(has_color(&scoped.wants, "red.500"));
        assert!(!has_color(&scoped.wants, "blue.500"));
        assert!(scoped.diagnostics.is_empty());

        let _ = std::fs::remove_dir_all(&root);
    }
}
