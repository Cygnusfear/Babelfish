use crate::config;
use crate::model::LanguagePair;
use crate::translator;
use std::sync::RwLock;
use tauri::State;

pub struct AppState {
    pub api_key: RwLock<String>,
}

#[tauri::command]
pub async fn translate(
    state: State<'_, AppState>,
    pair_name: String,
    text: String,
) -> Result<String, String> {
    let config = config::load_config().map_err(|e| format!("Failed to load config: {}", e))?;
    let state_api_key = state.api_key.read().unwrap().clone();
    let api_key = resolve_api_key(&config.api_key, &state_api_key);

    if api_key.is_empty() {
        return Err("API key not set".to_string());
    }

    let pair = config
        .language_pairs()
        .into_iter()
        .find(|p| p.name == pair_name)
        .ok_or_else(|| "Language pair not found".to_string())?;

    translator::translate(&api_key, &config.model, &pair, &text)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_language_pairs() -> Vec<LanguagePair> {
    config::load_config()
        .map(|config| config.language_pairs())
        .unwrap_or_else(|error| {
            eprintln!("Failed to load config: {error}");
            config::AppConfig::default().language_pairs()
        })
}

#[tauri::command]
pub async fn set_api_key(state: State<'_, AppState>, key: String) -> Result<(), String> {
    let mut config = config::load_config().map_err(|e| format!("Failed to load config: {}", e))?;
    config.api_key = key.clone();
    config::save_config(&config).map_err(|e| format!("Failed to save config: {}", e))?;

    let mut api_key = state.api_key.write().unwrap();
    *api_key = key;
    Ok(())
}

#[tauri::command]
pub fn get_api_key(state: State<'_, AppState>) -> String {
    state.api_key.read().unwrap().clone()
}

fn resolve_api_key(config_api_key: &str, state_api_key: &str) -> String {
    if !config_api_key.is_empty() {
        return config_api_key.to_string();
    }

    if !state_api_key.is_empty() {
        return state_api_key.to_string();
    }

    std::env::var("OPENROUTER_API_KEY").unwrap_or_default()
}
