//! Include-scoped trace entries that exist on disk, in extraction order.
//! Takes the request's collected sources and keeps only real files for the
//! import-graph walk. Matches the entry set extraction compiles so traced
//! hosts and extracted styles never disagree on scope.

use std::path::PathBuf;

/// Include-scoped entries that exist on disk, in extraction order.
/// Virtual-only sources carry no import graph and are skipped silently.
/// Takes the compile's collected sources: no second scan, no second read.
/// Needle-free contents cannot trace (see `trace_skip`) and skip the
/// styletrace re-parse; the staged map still serves edge-target reads.
/// Main-phase parse failures keep their entry regardless: the trace
/// re-parse fails identically and the located warning survives (C1).
pub(crate) fn entry_paths(sources: &[(String, String)], failed: &[bool]) -> Vec<PathBuf> {
    sources
        .iter()
        .enumerate()
        .filter(|(index, (_, content))| {
            failed.get(*index).copied().unwrap_or(false) || !trace_skip(content)
        })
        .map(|(_, (path, _))| PathBuf::from(path))
        // Trace walks the disk import graph, so virtual-only sources skip here, silently.
        .filter(|path| path.is_file())
        .collect()
}

/// True when a file's bytes cannot feed the styletrace entry parse.
/// Traced selection needs an import edge (`import`, conservative `require`),
/// JSX or type-argument bytes (`<`), a bare style-pipeline call name (`css`,
/// `box`, `splitCssProps` — the parser's exact bare-name fallbacks), or a
/// re-export source (`from`, covering `export *` and `export {} from`
/// barrels). Without all seven the entry parses to no imports, no
/// cross-file targets, and no traceable component: edges bottom out at the
/// pipeline and the pipeline needs one of these bytes. Conservative: any
/// needle present keeps the entry and its diagnostics.
pub(crate) fn trace_skip(content: &str) -> bool {
    !content.contains("import")
        && !content.contains("require")
        && !content.contains('<')
        && !content.contains("css")
        && !content.contains("box")
        && !content.contains("splitCssProps")
        && !content.contains("from")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    /// The bench dead-file shape: style-free const plus combiner.
    const DEAD: &str = "export const FACTOR_7 = 224\n\nexport function combine7(left: number, right: number): number {\n  return (left + right) * FACTOR_7\n}\n";

    #[test]
    fn dead_shape_skips() {
        assert!(trace_skip(DEAD));
    }

    #[test]
    fn each_needle_keeps() {
        let keep = [
            "import { Div } from '@reference-ui/react'\n",
            "const x = require('./y')\nexport const z = 1\n",
            "export const el = <div />\n",
            "export function C({ color }) {\n  return css(color)\n}\n",
            "export function C({ color }) {\n  return box(color)\n}\n",
            "export function C(props) {\n  const [a] = splitCssProps(props)\n  return a\n}\n",
            "export * from './card'\n",
            "export { Card } from './card'\n",
        ];
        for content in keep {
            assert!(!trace_skip(content), "should keep: {content:?}");
        }
    }

    #[test]
    fn plain_exports_without_edges_skip() {
        let skip = [
            "export const x = 1\n",
            "export function f(a, b) {\n  return a + b\n}\n",
            "export default 42\n",
            "export { local }\n",
        ];
        for content in skip {
            assert!(trace_skip(content), "should skip: {content:?}");
        }
    }

    #[test]
    fn entry_paths_filters_needle_free_real_files() {
        let dir = std::env::temp_dir().join(format!("lane-d-entries-{}", std::process::id()));
        fs::create_dir_all(&dir).expect("scratch dir");
        let dead = dir.join("dead.ts");
        let live = dir.join("live.tsx");
        fs::write(&dead, DEAD).expect("write dead");
        fs::write(&live, "import { Div } from '@reference-ui/react'\n").expect("write live");
        let sources = vec![
            (dead.to_string_lossy().to_string(), DEAD.to_string()),
            (
                live.to_string_lossy().to_string(),
                "import { Div } from '@reference-ui/react'\n".to_string(),
            ),
            ("src/virtual.ts".to_string(), "import { x } from 'y'\n".to_string()),
        ];
        let entries = entry_paths(&sources, &[false, false, false]);
        assert_eq!(entries, vec![live]);
        fs::remove_dir_all(&dir).expect("cleanup");
    }

    #[test]
    fn failed_needle_free_entries_keep_their_warning() {
        // SITE-57 shape: needle-free yet unparsable, so the gate alone
        // would drop the entry and its located trace warning.
        let broken = "export function Broken( {\n";
        assert!(trace_skip(broken));
        let dir = std::env::temp_dir().join(format!("lane-b-keepalive-{}", std::process::id()));
        fs::create_dir_all(&dir).expect("scratch dir");
        let path = dir.join("Broken.tsx");
        fs::write(&path, broken).expect("write broken");
        let sources = vec![(path.to_string_lossy().to_string(), broken.to_string())];
        assert!(entry_paths(&sources, &[false]).is_empty());
        assert_eq!(entry_paths(&sources, &[true]), vec![path]);
        fs::remove_dir_all(&dir).expect("cleanup");
    }
}
