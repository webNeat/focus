#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::env;
use std::process;
use std::io::prelude::*;
use std::fs::OpenOptions;

use tauri::*;

#[tauri::command]
fn add_task(content: String) {
  let path = env::var("FOCUS_TASKS_PATH").expect("The 'FOCUS_TASKS_PATH' env variable was not found!");
  let mut file = OpenOptions::new()
    .create(true)
    .append(true)
    .open(path)
    .expect("Error while opening the tasks file");
  writeln!(file, "{}", content).expect("Error while writing in the tasks file")
}

#[tauri::command]
fn hide_window(app: AppHandle) {
  let window = app.get_window("main").unwrap();
  let menu_item = app.tray_handle().get_item("toggle");
  window.hide();
  menu_item.set_title("Show");
}

fn make_tray() -> SystemTray {
  let menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("toggle".to_string(), "Hide"))
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));
  return SystemTray::new().with_menu(menu);
}

fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
  if let SystemTrayEvent::MenuItemClick { id, .. } = event {
    if id.as_str() == "quit" {
      process::exit(0);
    }
    if id.as_str() == "toggle" {
      let window = app.get_window("main").unwrap();
      let menu_item = app.tray_handle().get_item("toggle");
      if window.is_visible().unwrap() {
        window.hide();
        menu_item.set_title("Show");
      } else {
        window.show();
        window.center();
        menu_item.set_title("Hide");
      }
    }
  }
}

fn main() {
  tauri::Builder::default()
    .system_tray(make_tray())
    .on_system_tray_event(handle_tray_event)
    .invoke_handler(tauri::generate_handler![add_task, hide_window])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// fn main() {
//   let mut app = tauri::Builder::default()
//     .system_tray(make_tray())
//     .on_system_tray_event(handle_tray_event)
//     .invoke_handler(tauri::generate_handler![add_task])
//     .build(tauri::generate_context!())
//     .expect("error while running tauri application");
//   app.run(|app_handle, event| {
//     if let RunEvent::Ready = event {
//       let app_handle = app_handle.clone();
//       app_handle
//         .global_shortcut_manager()
//         .register("Shift+Delete", move || {
//           toggle_window(&app_handle);
//         })
//         .unwrap();
//     }
//   })
// }
