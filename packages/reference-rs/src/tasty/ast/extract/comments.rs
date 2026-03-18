use oxc_ast::ast::Comment;
use oxc_span::Span;

use super::super::super::model::{JsDoc, JsDocTag};

#[derive(Debug, Clone)]
pub(super) struct LeadingComment {
    pub(super) normalized_text: String,
    pub(super) is_jsdoc: bool,
}

#[derive(Debug, Clone, Default)]
pub(super) struct CommentMetadata {
    pub(super) description: Option<String>,
    pub(super) description_raw: Option<String>,
    pub(super) jsdoc: Option<JsDoc>,
}

pub(super) fn leading_comment_for_span(
    source: &str,
    comments: &[Comment],
    node_span: Span,
    exclude_starts_between: Option<&[u32]>,
) -> Option<LeadingComment> {
    let node_start = node_span.start;
    let leading: Vec<_> = comments
        .iter()
        .filter(|c| c.span.end <= node_start)
        .collect();
    if leading.is_empty() {
        return None;
    }

    let mut by_end: Vec<_> = leading.into_iter().collect();
    by_end.sort_by_key(|c| std::cmp::Reverse(c.span.end));

    let first = by_end[0];
    if let Some(exclude) = exclude_starts_between {
        if exclude
            .iter()
            .any(|&s| s > first.span.end && s < node_start)
        {
            return None;
        }
    }
    let mut block_start = first.span.start as usize;
    let block_end = first.span.end as usize;
    let mut is_jsdoc = first.is_jsdoc();

    for c in by_end.iter().skip(1) {
        let c_end = c.span.end as usize;
        let c_start = c.span.start as usize;
        let gap = source.get(c_end..block_start).unwrap_or("");
        if gap.trim().is_empty() && c_end <= block_start {
            block_start = c_start;
            is_jsdoc = is_jsdoc || c.is_jsdoc();
        } else {
            break;
        }
    }

    let raw = source.get(block_start..block_end)?;
    let normalized = normalize_comment_text(raw);
    if normalized.is_empty() {
        None
    } else {
        Some(LeadingComment {
            normalized_text: normalized,
            is_jsdoc,
        })
    }
}

fn normalize_comment_text(raw: &str) -> String {
    let mut s = raw.trim();
    if s.starts_with("/**") {
        s = s[3..].trim_start();
    } else if s.starts_with("/*") {
        s = s[2..].trim_start();
    }
    if s.ends_with("*/") {
        s = s[..s.len() - 2].trim_end();
    }

    let lines: Vec<&str> = s.lines().collect();
    let normalized_lines: Vec<String> = lines
        .iter()
        .map(|line| {
            let t = line.trim_start();
            let stripped = if t.starts_with("//") {
                t[2..].trim_start()
            } else if t.starts_with('*') {
                t[1..].trim_start()
            } else {
                t
            };
            stripped.to_string()
        })
        .collect();

    normalized_lines.join("\n").trim().to_string()
}

pub(super) fn parse_comment_metadata(comment: Option<LeadingComment>) -> CommentMetadata {
    let Some(comment) = comment else {
        return CommentMetadata::default();
    };
    let description_raw = Some(comment.normalized_text.clone());
    if !comment.is_jsdoc {
        return CommentMetadata {
            description: description_raw.clone(),
            description_raw,
            jsdoc: None,
        };
    }

    let jsdoc = parse_jsdoc(&comment.normalized_text);
    let description = jsdoc
        .summary
        .clone()
        .or_else(|| description_raw.clone());

    CommentMetadata {
        description,
        description_raw,
        jsdoc: Some(jsdoc),
    }
}

fn parse_jsdoc(normalized_text: &str) -> JsDoc {
    let mut summary_lines = Vec::new();
    let mut tags = Vec::new();
    let mut current_tag_name: Option<String> = None;
    let mut current_tag_lines: Vec<String> = Vec::new();
    let mut in_tags = false;

    for raw_line in normalized_text.lines() {
        let line = raw_line.trim();
        if let Some(tag_line) = line.strip_prefix('@') {
            if let Some(name) = current_tag_name.take() {
                tags.push(JsDocTag {
                    name,
                    value: normalize_jsdoc_tag_value(&current_tag_lines),
                });
                current_tag_lines.clear();
            }

            in_tags = true;
            let mut parts = tag_line.splitn(2, char::is_whitespace);
            let name = parts.next().unwrap_or("").trim().to_string();
            let value = parts.next().unwrap_or("").trim();
            if !value.is_empty() {
                current_tag_lines.push(value.to_string());
            }
            current_tag_name = if name.is_empty() { None } else { Some(name) };
        } else if in_tags {
            if current_tag_name.is_some() {
                current_tag_lines.push(line.to_string());
            }
        } else {
            summary_lines.push(line.to_string());
        }
    }

    if let Some(name) = current_tag_name.take() {
        tags.push(JsDocTag {
            name,
            value: normalize_jsdoc_tag_value(&current_tag_lines),
        });
    }

    JsDoc {
        summary: normalize_jsdoc_summary(&summary_lines),
        tags,
    }
}

fn normalize_jsdoc_summary(lines: &[String]) -> Option<String> {
    let summary = lines.join("\n").trim().to_string();
    if summary.is_empty() {
        None
    } else {
        Some(summary)
    }
}

fn normalize_jsdoc_tag_value(lines: &[String]) -> Option<String> {
    let value = lines.join("\n").trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}
