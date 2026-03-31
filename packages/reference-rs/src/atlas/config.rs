#[derive(Debug, Clone, Default)]
pub struct AtlasConfig {
    pub root_dir: String,
    pub include: Option<Vec<String>>,
    pub exclude: Option<Vec<String>>,
}
