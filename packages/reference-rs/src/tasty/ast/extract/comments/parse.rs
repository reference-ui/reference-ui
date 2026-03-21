use crate::tasty::model::{JsDoc, JsDocTag};

use super::leading::LeadingComment;

#[derive(Debug, Clone, Default)]
pub(crate) struct CommentMetadata {
    pub(crate) description: Option<String>,
    pub(crate) description_raw: Option<String>,
    pub(crate) jsdoc: Option<JsDoc>,
}

#[derive(Default)]
struct JsDocParserState {
    summary_lines: Vec<String>,
    tags: Vec<JsDocTag>,
    current_tag_name: Option<String>,
    current_tag_lines: Vec<String>,
    in_tags: bool,
}

pub(crate) fn parse_comment_metadata(comment: Option<LeadingComment>) -> CommentMetadata {
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
