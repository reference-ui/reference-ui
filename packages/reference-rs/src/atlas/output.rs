use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::atlas::model::Component;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export_to = "js/atlas/generated/", rename_all = "kebab-case")]
pub enum AtlasDiagnosticCode {
	UnresolvedPropsType,
	UnsupportedPropsAnnotation,
	UnresolvedIncludePackage,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/atlas/generated/", rename_all = "camelCase")]
pub struct AtlasDiagnostic {
	pub code: AtlasDiagnosticCode,
	pub message: String,
	pub source: String,
	#[serde(skip_serializing_if = "Option::is_none")]
	#[ts(optional)]
	pub component_name: Option<String>,
	#[serde(skip_serializing_if = "Option::is_none")]
	#[ts(optional)]
	pub interface_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/atlas/generated/", rename_all = "camelCase")]
pub struct AtlasAnalysisResult {
	pub components: Vec<Component>,
	pub diagnostics: Vec<AtlasDiagnostic>,
}
