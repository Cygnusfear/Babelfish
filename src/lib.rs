mod commands;
mod config;
mod model;
mod translator;

pub use commands::AppState;
use std::sync::RwLock;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();

    let app_config = config::load_config().unwrap_or_else(|error| {
        eprintln!("Failed to load config: {error}");
        config::AppConfig::default()
    });

    let api_key = if app_config.api_key.is_empty() {
        std::env::var("OPENROUTER_API_KEY").unwrap_or_default()
    } else {
        app_config.api_key.clone()
    };
    let state = AppState {
        api_key: RwLock::new(api_key),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::translate,
            commands::get_language_pairs,
            commands::set_api_key,
            commands::get_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
