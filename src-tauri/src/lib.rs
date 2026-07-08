// PikAsistant — backend Tauri
// - Stockage sécurisé des clés API via le trousseau natif de l'OS
//   (Windows Credential Manager sur Windows, via le crate `keyring`)
// - Icône de zone de notification (tray) : afficher/masquer + quitter
// - Fermeture de la fenêtre = masquage (l'app vit dans le tray)

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

const KEYRING_SERVICE: &str = "PikAsistant";

fn keyring_entry(provider: &str) -> Result<keyring::Entry, String> {
    match provider {
        "anthropic" | "openai" | "gemini" => {
            keyring::Entry::new(KEYRING_SERVICE, provider).map_err(|e| e.to_string())
        }
        _ => Err(format!("Fournisseur inconnu: {provider}")),
    }
}

/// Enregistre (ou remplace) la clé API d'un fournisseur dans le trousseau OS.
/// Une clé vide supprime l'entrée.
#[tauri::command]
fn set_api_key(provider: String, key: String) -> Result<(), String> {
    let entry = keyring_entry(&provider)?;
    if key.trim().is_empty() {
        match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    } else {
        entry.set_password(key.trim()).map_err(|e| e.to_string())
    }
}

/// Récupère la clé API d'un fournisseur (None si absente).
#[tauri::command]
fn get_api_key(provider: String) -> Result<Option<String>, String> {
    let entry = keyring_entry(&provider)?;
    match entry.get_password() {
        Ok(p) => Ok(Some(p)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Supprime la clé API d'un fournisseur.
#[tauri::command]
fn delete_api_key(provider: String) -> Result<(), String> {
    let entry = keyring_entry(&provider)?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

fn build_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Afficher / Masquer", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &quit])?;

    TrayIconBuilder::with_id("pikasistant-tray")
        .icon(
            app.default_window_icon()
                .expect("icône d'application manquante")
                .clone(),
        )
        .tooltip("PikAsistant")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => toggle_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Deuxième lancement : on remet la fenêtre existante au premier plan.
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            set_api_key,
            get_api_key,
            delete_api_key
        ])
        .setup(|app| {
            build_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Fermer la fenêtre ne quitte pas : l'app reste dans le tray.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
