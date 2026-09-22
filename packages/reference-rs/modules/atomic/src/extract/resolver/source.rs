//! The atomic side of the shared module graph: an in-memory-first filesystem
//! over the compile sources with disk fallback, plus the loader that serves
//! staged source records and parses externals once on demand. Sources keep
//! their lexical keys (never disk-canonicalized) so one file is one record;
//! externally resolved targets parse into values-only entries with literal
//! bags and no descriptors, exactly as the old externals sweep did.

use std::rc::Rc;

use rustc_hash::FxHashMap;

use module_graph::{DiskFs, FileSystem, Loader, ModuleKey, ModuleRecord, ProbeMemo};
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

use super::super::constants::{collect_local_constants, LocalConstants};

/// Compile sources over disk: memory answers sources, disk answers the rest.
/// `tsconfig` manifests and `node_modules` targets resolve through the disk
/// arm, while every staged source holds its lexical key for stable identity.
#[derive(Debug)]
pub struct AtomicFs<'s> {
    sources: &'s [(String, String)],
    index: FxHashMap<String, usize>,
    disk: DiskFs,
    memo: ProbeMemo,
}

impl<'s> AtomicFs<'s> {
    /// An fs over the compile sources, indexed by normalized key.
    pub fn new(sources: &'s [(String, String)]) -> Self {
        let mut index = FxHashMap::default();
        for (position, (path, _)) in sources.iter().enumerate() {
            index
                .entry(ModuleKey::new(path).as_str().to_string())
                .or_insert(position);
        }
        Self {
            sources,
            index,
            disk: DiskFs,
            memo: ProbeMemo::new(),
        }
    }

    /// The staged content for a normalized key, when it is a source.
    fn staged(&self, path: &str) -> Option<&'s str> {
        let key = ModuleKey::new(path);
        self.content(&key)
    }

    /// The staged content for a module key, when it is a source.
    pub(crate) fn content(&self, key: &ModuleKey) -> Option<&'s str> {
        let sources: &'s [(String, String)] = self.sources;
        let position = self.index.get(key.as_str())?;
        Some(sources[*position].1.as_str())
    }
}

impl FileSystem for AtomicFs<'_> {
    fn read_to_string(&self, path: &str) -> Option<String> {
        if let Some(staged) = self.staged(path) {
            return Some(staged.to_string());
        }
        self.memo
            .read_to_string(path, |probed| self.disk.read_to_string(probed))
    }

    fn is_file(&self, path: &str) -> bool {
        let key = ModuleKey::new(path);
        if self.index.contains_key(key.as_str()) {
            return true;
        }
        self.memo.is_file(path, |probed| self.disk.is_file(probed))
    }

    fn is_dir(&self, path: &str) -> bool {
        self.memo.is_dir(path, |probed| self.disk.is_dir(probed))
    }

    fn read_dir(&self, path: &str) -> Vec<String> {
        self.disk.read_dir(path)
    }

    fn canonicalize(&self, path: &str) -> Option<String> {
        // Sources canonicalize to their lexical key: disk canonicalization
        // would split one file into two identities under symlinked parents.
        let key = ModuleKey::new(path);
        if self.index.contains_key(key.as_str()) {
            return Some(key.as_str().to_string());
        }
        self.memo
            .canonicalize(path, |probed| self.disk.canonicalize(probed))
    }
}

/// Loads records for the graph: staged sources replay without parsing, and
/// externally resolved targets parse once into values-only entries. Every
/// served record's literal bag stays in `values` for precise per-file reads.
pub struct AtomicLoader<'s> {
    fs: Rc<AtomicFs<'s>>,
    staged: FxHashMap<ModuleKey, (ModuleRecord, LocalConstants)>,
    values: FxHashMap<ModuleKey, LocalConstants>,
}

impl<'s> AtomicLoader<'s> {
    /// A loader over `fs` serving `staged` source records without parsing.
    pub fn new(
        fs: Rc<AtomicFs<'s>>,
        staged: FxHashMap<ModuleKey, (ModuleRecord, LocalConstants)>,
    ) -> Self {
        Self {
            fs,
            staged,
            values: FxHashMap::default(),
        }
    }

    /// One file's literal bag, once its record has served.
    pub fn bag(&self, key: &ModuleKey) -> Option<&LocalConstants> {
        self.values.get(key)
    }
}

impl Loader for AtomicLoader<'_> {
    fn load(&mut self, key: &ModuleKey) -> Option<ModuleRecord> {
        if let Some((record, bag)) = self.staged.remove(key) {
            self.values.insert(key.clone(), bag);
            return Some(record);
        }
        let content = self.fs.read_to_string(key.as_str())?;
        let (record, bag) = parse_record(key.as_str(), &content)?;
        self.values.insert(key.clone(), bag);
        Some(record)
    }
}

/// Parse one external target into its record and literal bag; unreadable or
/// unparseable targets stay absent, leaving their importers on the refusal.
fn parse_record(path: &str, content: &str) -> Option<(ModuleRecord, LocalConstants)> {
    let allocator = Allocator::default();
    // Mirror lib.rs: JSX follows the extension, TypeScript always on.
    let source_type = SourceType::from_path(std::path::Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    let ret = Parser::new(&allocator, content, source_type).parse();
    if ret.panicked {
        return None;
    }
    let record = ModuleRecord::collect(&ret.program);
    let bag = collect_local_constants(&ret.program, path, Some(content));
    Some((record, bag))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// An fs over two staged sources plus the disk arm.
    fn fs() -> AtomicFs<'static> {
        // Leaked once per test process: the fs borrows sources by contract.
        let sources: &'static [(String, String)] = Box::leak(Box::new(vec![
            (
                "/p/src/app.ts".to_string(),
                "import { b } from './b';".to_string(),
            ),
            (
                "/p/src/b.ts".to_string(),
                "export const b = 'red';".to_string(),
            ),
        ]));
        AtomicFs::new(sources)
    }

    #[test]
    fn staged_sources_answer_from_memory() {
        let fs = fs();
        assert!(fs.is_file("/p/src/app.ts"));
        assert!(fs.is_file("/p/src/./app.ts"));
        assert_eq!(
            fs.read_to_string("/p/src/b.ts").as_deref(),
            Some("export const b = 'red';")
        );
        assert!(!fs.is_file("/p/src/missing.ts"));
    }

    #[test]
    fn sources_canonicalize_to_their_lexical_key() {
        let fs = fs();
        assert_eq!(
            fs.canonicalize("/p/src/./app.ts").as_deref(),
            Some("/p/src/app.ts")
        );
        assert_eq!(fs.canonicalize("/p/src/missing.ts"), None);
    }

    #[test]
    fn staged_records_serve_without_parsing() {
        let fs = Rc::new(fs());
        let key = ModuleKey::new("/p/src/b.ts");
        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, "export const b = 'red';", SourceType::ts()).parse();
        let record = ModuleRecord::collect(&ret.program);
        let bag = collect_local_constants(&ret.program, "/p/src/b.ts", None);
        let staged = FxHashMap::from_iter([(key.clone(), (record, bag))]);
        let mut loader = AtomicLoader::new(fs, staged);
        let served = loader.load(&key).expect("staged record serves");
        assert!(served.exports.get("b").is_some());
        assert!(loader.bag(&key).is_some());
        assert!(loader.load(&ModuleKey::new("/p/src/missing.ts")).is_none());
    }
}
