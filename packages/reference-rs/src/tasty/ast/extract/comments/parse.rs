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
        return plain_comment_metadata(description_raw);
    }

    let jsdoc = parse_jsdoc(&comment.normalized_text);
    let description = jsdoc.summary.clone().or_else(|| description_raw.clone());

    CommentMetadata {
        description,
        description_raw,
        jsdoc: Some(jsdoc),
    }
}

fn plain_comment_metadata(description_raw: Option<String>) -> CommentMetadata {
    CommentMetadata {
        description: description_raw.clone(),
        description_raw,
        jsdoc: None,
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
        match line.strip_prefix('@') {
            Some(tag_line) => self.start_tag(tag_line),
            None if self.in_tags => self.push_tag_line(line),
            None => self.summary_lines.push(line.to_string()),
        }
    }

    fn start_tag(&mut self, tag_line: &str) {
        self.flush_open_tag();
        self.in_tags = true;

        let (name, value) = split_tag_header(tag_line);
        if !value.is_empty() {
            self.current_tag_lines.push(value);
        }
        self.current_tag_name = (!name.is_empty()).then(|| name);
    }

    fn push_tag_line(&mut self, line: &str) {
        if self.current_tag_name.is_some() {
            self.current_tag_lines.push(line.to_string());
        }
    }

    fn flush_open_tag(&mut self) {
        push_completed_jsdoc_tag(
            &mut self.current_tag_name,
            &mut self.current_tag_lines,
            &mut self.tags,
        );
    }

    fn finish(mut self) -> JsDoc {
        self.flush_open_tag();
        JsDoc {
            summary: non_empty_joined_lines(&self.summary_lines),
            tags: self.tags,
        }
    }
}

fn split_tag_header(tag_line: &str) -> (String, String) {
    let mut parts = tag_line.splitn(2, char::is_whitespace);
    let name = parts.next().unwrap_or("").trim().to_string();
    let value = parts.next().unwrap_or("").trim().to_string();
    (name, value)
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
        value: non_empty_joined_lines(current_tag_lines),
    });
    current_tag_lines.clear();
}

fn non_empty_joined_lines(lines: &[String]) -> Option<String> {
    let text = lines.join("\n").trim().to_string();
    (!text.is_empty()).then_some(text)
}
