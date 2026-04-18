use crate::atlas::model::{Component, ComponentInterface, ComponentProp, Usage};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct ModuleInfo {
    pub path: PathBuf,
    pub content: String,
    pub display_source: String,
    pub imports: HashMap<String, ImportBinding>,
    pub namespace_imports: HashMap<String, String>,
    pub components: HashMap<String, ComponentDecl>,
    pub default_component: Option<String>,
    pub named_component_reexports: HashMap<String, ReExport>,
    pub types: HashMap<String, TypeDef>,
    pub named_type_reexports: HashMap<String, ReExport>,
}

#[derive(Clone, Debug)]
pub struct ImportBinding {
    pub source: String,
    pub local: String,
    pub imported: Option<String>,
    pub kind: ImportKind,
    pub is_type: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ImportKind {
    Named,
    Default,
    Namespace,
}

#[derive(Clone, Debug)]
pub struct ReExport {
    pub source: String,
    pub imported: String,
}

#[derive(Clone, Debug)]
pub struct ComponentDecl {
    pub name: String,
    pub file_path: PathBuf,
    pub source_display: String,
    pub app_relative_path: Option<String>,
    pub props: PropsAnnotation,
}

#[derive(Clone, Debug)]
pub enum PropsAnnotation {
    Named(String),
    InlineObject,
    None,
}

#[derive(Clone, Debug)]
pub struct TypeDef {
    pub expr: TypeExpr,
}

#[derive(Clone, Debug)]
pub enum TypeExpr {
    Object(Vec<PropDef>),
    Intersection(Vec<TypeExpr>),
    Reference(String),
    UnionLiterals(Vec<String>),
    Unknown,
}

#[derive(Clone, Debug)]
pub struct PropDef {
    pub name: String,
    pub value_type: PropValueType,
}

#[derive(Clone, Debug)]
pub enum PropValueType {
    Reference(String),
    UnionLiterals(Vec<String>),
    Unknown,
}

#[derive(Clone, Debug)]
pub struct ResolvedType {
    pub name: String,
    pub source: String,
    pub owner_module: PathBuf,
    pub expr: TypeExpr,
}

#[derive(Clone, Debug)]
pub struct ComponentTemplate {
    pub name: String,
    pub source: String,
    pub interface_name: Option<String>,
    pub interface_source: Option<String>,
    pub file_path: PathBuf,
    pub app_relative_path: Option<String>,
    pub props: Vec<PropTemplate>,
}

#[derive(Clone, Debug)]
pub struct PropTemplate {
    pub name: String,
    pub allowed_values: Option<Vec<String>>,
}

#[derive(Clone, Debug)]
pub struct UsageState {
    pub component: Component,
    pub prop_allowed_values: BTreeMap<String, BTreeSet<String>>,
    pub prop_value_counts: BTreeMap<String, BTreeMap<String, u32>>,
    pub file_presence_count: u32,
    pub example_set: BTreeSet<String>,
    pub used_with_counts: BTreeMap<String, u32>,
}

#[derive(Clone, Debug)]
pub struct JsxOccurrence {
    pub tag_name: String,
    pub snippet: String,
    pub attributes: Vec<JsxAttribute>,
    pub has_children: bool,
}

#[derive(Clone, Debug)]
pub struct JsxAttribute {
    pub name: String,
    pub literal_value: Option<String>,
}

pub fn component_key(name: &str, source: &str) -> String {
    format!("{name}@@{source}")
}

pub fn create_usage_state(template: ComponentTemplate) -> UsageState {
    let mut prop_allowed_values = BTreeMap::new();
    let props = template
        .props
        .into_iter()
        .map(|prop| {
            if let Some(values) = &prop.allowed_values {
                prop_allowed_values.insert(prop.name.clone(), values.iter().cloned().collect());
            }
            ComponentProp {
                name: prop.name,
                count: 0,
                usage: Usage::Unused,
                values: None,
            }
        })
        .collect::<Vec<_>>();

    UsageState {
        component: Component {
            name: template.name,
            interface: template
                .interface_name
                .zip(template.interface_source)
                .map(|(name, source)| ComponentInterface { name, source }),
            source: template.source,
            count: 0,
            props,
            usage: Usage::Unused,
            examples: Vec::new(),
            used_with: BTreeMap::new(),
        },
        prop_allowed_values,
        prop_value_counts: BTreeMap::new(),
        file_presence_count: 0,
        example_set: BTreeSet::new(),
        used_with_counts: BTreeMap::new(),
    }
}
