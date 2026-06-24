use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 1. 只有在 debug 模式下才強制開啟開發者工具
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools(); // 強制開啟 DevTools
                }
            }

            // 2. 只有在 debug 模式下才載入日誌外掛（Log Plugin）
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 確保整個 setup 區塊最後只回傳一次 Ok(())
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
