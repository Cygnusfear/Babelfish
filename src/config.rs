use crate::model::LanguagePair;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

pub const DEFAULT_MODEL: &str = "google/gemini-2.5-flash";

pub const DEFAULT_PROMPT_TEMPLATE: &str = r#"# ${from_lang} ↔ ${to_lang} Translation

You are a professional ${from_lang}-${to_lang} translator.

**Task**: Detect whether the input text is in ${from_lang} or ${to_lang}, then translate it to the other language.

**Rules**:
- Preserve the tone and formality level of the original text
- Maintain formatting (line breaks, lists, special characters, etc.)
- Be concise and accurate
- Output ONLY the translation, no explanations or meta-commentary
- For ambiguous text, prefer the most natural translation
"#;

#[derive(Clone, Serialize, Deserialize)]
pub struct LanguagePairConfig {
    pub name: String,
    pub label: String,
    pub from_lang: String,
    pub to_lang: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default)]
    pub api_key: String,
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default = "default_prompt_template")]
    pub prompt_template: String,
    #[serde(default = "default_language_pairs")]
    pub language_pairs: Vec<LanguagePairConfig>,
}

impl AppConfig {
    fn normalized(mut self) -> Self {
        if self.model.trim().is_empty() {
            self.model = default_model();
        }

        if self.prompt_template.trim().is_empty() {
            self.prompt_template = default_prompt_template();
        }

        if self.language_pairs.is_empty() {
            self.language_pairs = default_language_pairs();
        }

        self
    }

    pub fn language_pairs(&self) -> Vec<LanguagePair> {
        self.language_pairs
            .iter()
            .map(|pair| LanguagePair::from_config(pair, &self.prompt_template))
            .collect()
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            model: default_model(),
            prompt_template: default_prompt_template(),
            language_pairs: default_language_pairs(),
        }
    }
}

pub fn config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("babelfish")
        .join("config.json")
}

pub fn load_config() -> Result<AppConfig> {
    let path = config_path();

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(&path)
        .with_context(|| format!("Failed to read config file: {}", path.display()))?;
    let config = serde_json::from_str::<AppConfig>(&content)
        .with_context(|| format!("Failed to parse config file: {}", path.display()))?;

    Ok(config.normalized())
}

pub fn save_config(config: &AppConfig) -> Result<()> {
    let path = config_path();

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }

    let content = serde_json::to_string_pretty(config).context("Failed to serialize config")?;
    fs::write(&path, content)
        .with_context(|| format!("Failed to write config file: {}", path.display()))
}

fn default_model() -> String {
    DEFAULT_MODEL.to_string()
}

fn default_prompt_template() -> String {
    DEFAULT_PROMPT_TEMPLATE.trim().to_string()
}

fn default_language_pairs() -> Vec<LanguagePairConfig> {
    vec![
        LanguagePairConfig {
            name: "es_en".to_string(),
            label: "ES ↔ EN".to_string(),
            from_lang: "Spanish".to_string(),
            to_lang: "English".to_string(),
        },
        LanguagePairConfig {
            name: "pt_en".to_string(),
            label: "PT ↔ EN".to_string(),
            from_lang: "Portuguese".to_string(),
            to_lang: "English".to_string(),
        },
    ]
}
