use crate::config::LanguagePairConfig;

#[derive(Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct LanguagePair {
    pub name: String,
    pub label: String,
    pub from_lang: String,
    pub to_lang: String,
    pub prompt: String,
}

impl LanguagePair {
    pub fn from_config(config: &LanguagePairConfig, prompt_template: &str) -> Self {
        let prompt = prompt_template
            .replace("${from_lang}", &config.from_lang)
            .replace("${to_lang}", &config.to_lang);

        Self {
            name: config.name.clone(),
            label: config.label.clone(),
            from_lang: config.from_lang.clone(),
            to_lang: config.to_lang.clone(),
            prompt,
        }
    }
}

pub struct Model {
    pub api_key: String,
    pub current_pair_idx: usize,
    pub pairs: Vec<LanguagePair>,
    pub input: String,
    pub messages: Vec<String>,
    pub translating: bool,
    pub width: u16,
    pub height: u16,
    pub scroll: u16,
    pub auto_scroll: bool,
    pub chat_area_y: u16,
    pub chat_area_height: u16,
    pub copied_message: Option<String>,
    pub copied_index: Option<usize>,
    pub copied_at: Option<std::time::Instant>,
}

impl Model {
    pub fn new(api_key: String, pairs: Vec<LanguagePair>) -> Self {
        Self {
            api_key,
            current_pair_idx: 0,
            pairs,
            input: String::new(),
            messages: Vec::new(),
            translating: false,
            width: 80,
            height: 24,
            scroll: 0,
            auto_scroll: true,
            chat_area_y: 3,
            chat_area_height: 0,
            copied_message: None,
            copied_index: None,
            copied_at: None,
        }
    }

    pub fn next_pair(&mut self) {
        if !self.pairs.is_empty() {
            self.current_pair_idx = (self.current_pair_idx + 1) % self.pairs.len();
        }
    }

    pub fn current_pair(&self) -> &LanguagePair {
        &self.pairs[self.current_pair_idx]
    }

    pub fn get_translation_at(&self, row: u16) -> Option<(usize, String)> {
        if row < self.chat_area_y || row >= self.chat_area_y + self.chat_area_height {
            return None;
        }

        let mut line_count = 0u16;
        let target_line = row
            .saturating_sub(self.chat_area_y)
            .saturating_add(self.scroll);

        for (i, msg) in self.messages.iter().enumerate() {
            let _hr_width = self
                .width
                .saturating_sub(if i % 2 == 0 { 6 } else { 14 })
                .max(10) as usize;
            line_count += 2;

            let msg_lines: Vec<&str> = msg.lines().collect();
            let msg_line_count = msg_lines.len() as u16;

            if target_line >= line_count && target_line < line_count + msg_line_count && i % 2 == 1
            {
                return Some((i, msg.clone()));
            }

            line_count += msg_line_count + 1;
        }

        None
    }
}
