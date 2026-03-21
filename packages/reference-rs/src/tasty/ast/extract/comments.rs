use oxc_ast::ast::Comment;
use oxc_span::Span;

use crate::tasty::model::{JsDoc, JsDocTag};

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

#[derive(Default)]
struct JsDocParserState {
    summary_lines: Vec<String>,
    tags: Vec<JsDocTag>,
    current_tag_name: Option<String>,
    current_tag_lines: Vec<String>,
    in_tags: bool,
}

pub(super) fn leading_comment_for_span(
    source: &str,
    comments: &[Comment],
    node_span: Span,
    exclude_starts_between: Option<&[u32]>,
) -> Option<LeadingComment> {
    let node_start = node_span.start;
    let mut by_end: Vec<_> = comments
        .iter()
        .filter(|c| c.span.end <= node_start)
        .collect();
    if by_end.is_empty() {
        return None;
    }
    by_end.sort_by_key(|c| std::cmp::Reverse(c.span.end));

    let first = by_end[0];
    if should_exclude_leading_comment(exclude_starts_between, first.span.end, node_start) {
        return None;
    }
    if !is_contiguous_comment_gap(source, first.span.end as usize, node_start as usize) {
        return None;
    }

    let (block_start, is_jsdoc) = collect_leading_comment_block(source, &by_end, first);
    let block_end = first.span.end as usize;
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

fn should_exclude_leading_comment(
    exclude_starts_between: Option<&[u32]>,
    block_end: u32,
    node_start: u32,
) -> bool {
    exclude_starts_between
        .map(|exclude| {
            exclude
                .iter()
                .any(|&start| start > block_end && start < node_start)
        })
        .unwrap_or(false)
}

fn collect_leading_comment_block(
    source: &str,
    comments_by_end: &[&Comment],
    first: &Comment,
) -> (usize, bool) {
    let mut block_start = first.span.start as usize;
    let mut is_jsdoc = first.is_jsdoc();

    for comment in comments_by_end.iter().skip(1) {
        let comment_end = comment.span.end as usize;
        if !is_contiguous_comment_gap(source, comment_end, block_start) {
            break;
        }

        block_start = comment.span.start as usize;
        is_jsdoc |= comment.is_jsdoc();
    }

    (block_start, is_jsdoc)
}

fn is_contiguous_comment_gap(source: &str, comment_end: usize, block_start: usize) -> bool {
    let gap = source.get(comment_end..block_start).unwrap_or("");
    comment_end <= block_start && gap.trim().is_empty()
}

fn normalize_comment_text(raw: &str) -> String {
    let normalized_lines: Vec<String> = strip_block_comment_delimiters(raw)
        .lines()
        .map(normalize_comment_line)
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
    let description = jsdoc.summary.clone().or_else(|| description_raw.clone());

    CommentMetadata {
        description,
        description_raw,
        jsdoc: Some(jsdoc),
    }
}

fn parse_jsdoc(normalized_text: &str) -> JsDoc {
    let mut state = JsDocParserState::default();
    for raw_line in normalized_text.lines() {
        state.handle_line(raw_line);
    }
    state.finish()
}

impl JsDocParserState {
    fn handle_line(&mut self, raw_line: &str) {
        let line = raw_line.trim();
        if let Some(tag_line) = line.strip_prefix('@') {
            self.start_tag(tag_line);
        } else if self.in_tags {
            self.push_tag_line(line);
        } else {
            self.summary_lines.push(line.to_string());
        }
    }

    fn start_tag(&mut self, tag_line: &str) {
        push_completed_jsdoc_tag(
            &mut self.current_tag_name,
            &mut self.current_tag_lines,
            &mut self.tags,
        );

        self.in_tags = true;
        let mut parts = tag_line.splitn(2, char::is_whitespace);
        let name = parts.next().unwrap_or("").trim();
        let value = parts.next().unwrap_or("").trim();

        if !value.is_empty() {
            self.current_tag_lines.push(value.to_string());
        }

        self.current_tag_name = (!name.is_empty()).then(|| name.to_string());
    }

    fn push_tag_line(&mut self, line: &str) {
        if self.current_tag_name.is_some() {
            self.current_tag_lines.push(line.to_string());
        }
    }

    fn finish(mut self) -> JsDoc {
        push_completed_jsdoc_tag(
            &mut self.current_tag_name,
            &mut self.current_tag_lines,
            &mut self.tags,
        );

        JsDoc {
            summary: normalize_jsdoc_summary(&self.summary_lines),
            tags: self.tags,
        }
    }
}

fn strip_block_comment_delimiters(raw: &str) -> &str {
    let mut stripped = raw.trim();
    if stripped.starts_with("/**") {
        stripped = stripped[3..].trim_start();
    } else if stripped.starts_with("/*") {
        stripped = stripped[2..].trim_start();
    }
    if stripped.ends_with("*/") {
        stripped = stripped[..stripped.len() - 2].trim_end();
    }

    stripped
}

fn normalize_comment_line(line: &str) -> String {
    let trimmed = line.trim_start();
    if let Some(stripped) = trimmed.strip_prefix("//") {
        return stripped.trim_start().to_string();
    }
    if let Some(stripped) = trimmed.strip_prefix('*') {
        return stripped.trim_start().to_string();
    }

    trimmed.to_string()
}

fn push_completed_jsdoc_tag(
    current_tag_name: &mut Option<String>,
    current_tag_lines: &mut Vec<String>,
    tags: &mut Vec<JsDocTag>,
) {
    let Some(name) = current_tag_name.take() else {
        return;
    };

    tags.push(JsDocTag {
        name,
        value: normalize_jsdoc_tag_value(current_tag_lines),
    });
    current_tag_lines.clear();
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
