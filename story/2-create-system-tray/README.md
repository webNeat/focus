Hello 👋,

In [the previous article](), I shared how I started working on a small productivity tool called `focus`. The idea of the tool is simple:

- I hit a keyboard shortcut anywhere on my computer.
- A popup shows on the center of the screen containing a text input.
- I type some idea/task I want to remember later, then I hit `Enter`.
- The popup disapears.
- All ideas I type are added to a text file. The path of that file is set by the environment variable `FOCUS_TASKS_PATH`.

Last time, I had a working version, but there is one problem: When I hit the keyboard shortcut, the popup takes about 2 seconds to open and render correctly. Let's make it "pop up" faster.

# Contents

- [Why is it slow? it's just a text input right?](#why-is-it-slow-its-just-a-text-input-right)
- [How to make it open faster ?](#how-to-make-it-open-faster)
- [Adding the application to the system tray](#adding-the-application-to-the-system-tray)
- [Hiding the window from the frontend](#hiding-the-window-from-the-frontend)
- [Show the window with a global shortcut](#show-the-window-with-a-global-shortcut)

# Why is it slow? it's just a text input right?

From my understanding of [Tauri's process model](https://tauri.studio/v1/guides/architecture/process-model), when I hit the shortcut, the following happens:

- A core process is created. This is the process that runs the Rust code.
- A webview process is created by the core process. This is the once running the frontend code.

You can think of a webview like a mini browser that has everything needed to show a web page and handle interactions on it (parsing HTML, applying CSS, executing Javascript, ... ). Plus it can communicate with the core process to run Rust code. 

This explains why it takes time the start it (like it takes time to open Chrome or VSCode).

# How to make it open faster ?

My idea is to open to the app once and keep it running in the background, so that when the shortcut is hit, we only show the window which should be faster then creating it from scratch. One way to do that is to add the app to the system tray (the section that has the small icons on the tasksbar. You know the one that you close an app but still find its icon there telling you "I am still alive!").

# Adding the application to the system tray

By following [the documentation](https://tauri.studio/v1/guides/features/system-tray), first we need to specify the icon of our app on the system tray using the `tauri.conf.json` file, let's use the already existing Tauri icon (I may need to design a custom icon for this application, but not a priority for now).

```json
{
  "tauri": {
    // ...
    "systemTray": {
      "iconPath": "icons/32x32.png"
    }
  }
}
```

Next I modified the dependencies section of the `Cargo.toml` file to include the feature `gtk-tray` which is needed on my linux distribution.

```
tauri = { version = "1.0.0-rc.11", features = ["api-all", "gtk-tray", "system-tray"] }
```

Now we need to edit the `main.rs` file to create the system tray and specify the menu items attached to it

```rs
use tauri::*;

fn make_tray() -> SystemTray {     // <- a function that creates the system tray
  let menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("toggle".to_string(), "Hide"))
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));
  return SystemTray::new().with_menu(menu);
}

fn main() {
  tauri::Builder::default()
    .system_tray(make_tray())  // <- adding the system tray to the application
    .invoke_handler(tauri::generate_handler![add_task])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

The `make_tray` function creates the system tray with a menu containing two items: `Hide` and `Quit`.

- Initialy the application window is shown; I want to be able to hide it by clicking the `Hide` menu item. Then its text should become `Show` and clicking it should show the window again.
- Clicking on the `Quit` menu item should close the application.

If I run the application now, I see the Tauri icon on the system tray. Clicking on it shows the menu with `Hide` and `Quit` items, but clicking them does nothing. In order to run some code when the items are clicked we should add an event handler using the `on_system_tray_event` method:

```rs
fn main() {
  tauri::Builder::default()
    .system_tray(make_tray())
    .on_system_tray_event(handle_tray_event)  // <- handling the system tray events
    .invoke_handler(tauri::generate_handler![add_task])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

Then we define the `handle_tray_event` function:

```rs
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
```

The result:

![System tray menu](https://raw.githubusercontent.com/webNeat/focus/main/story/2-create-system-tray/system-tray-menu.gif)

# Hiding the window from the frontend

The next step is to hide the window when `Enter` is typed on the input instead of closing the application. To do so, let's update the `App` component's code:

```tsx
//...
import { appWindow } from '@tauri-apps/api/window'

function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
      await appWindow.hide()
    }
  }
  // ...
}
```

Now when I type something and hit `Enter`, the window is hidden but there are two problems:

1. The menu item still shows `Hide` when I click the icon on the system tray.
2. When the window is shown again, the text I typed last time is still there.

Let's start by fixing the second problem which is easier. All we have to do is to set the `content` state to empty string after invoking the `add_task` command.

```ts
function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
      setContent('')
      await appWindow.hide()
    }
  }
  // ...
}
```

The first problem is trickier. I didn't find a way to change the menu item text using the Javascript API. So it seems that I need to call Rust code to do that. Let's create a new command `hide_window`:
```rs
#[tauri::command]
fn hide_window(app: AppHandle) {
  let window = app.get_window("main").unwrap();
  let menu_item = app.tray_handle().get_item("toggle");
  window.hide();
  menu_item.set_title("Show");
}
//...
fn main() {
  tauri::Builder::default()
    .system_tray(make_tray())
    .on_system_tray_event(handle_tray_event)
    .invoke_handler(tauri::generate_handler![add_task, hide_window]) // <- added the command here
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

And call it from the frontend:

```tsx
function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
      setContent('')
      await invoke('hide_window')
    }
  }
  //...
}
```

Note that the `hide_window` command takes an argument `app` of type `AppHandle`, but when don't pass any argument when calling it from Javascript. Tauri will inject that argument automatically based on its type.

# Show the window with a global shortcut

So far, I was running a new instance of the application when typing the shortcut, now I want to just show the hidden window and not open a whole new instance. Tauri offers a way to [register global shortcuts](https://tauri.studio/v1/api/js/modules/globalShortcut) and run custom code when they are pressed.

Let's enable global shortcuts on `tauri.conf.json`

```json
{
  "tauri": {
    "allowlist": {
      "globalShortcut": {
        "all": true
      }
    }
  },
  // ...
}
```

Then register the shortcut `Alt+Enter` by adding the following code to the `main.tsx` file:

```tsx
import { register } from '@tauri-apps/api/globalShortcut'

register('Alt+Enter', () => {
  console.log('Alt+Enter pressed!')
})
```

Now the string `Alt+Enter pressed!` should be logged into the console every time I press `Alt+Enter`. But it doesn't work and I didn't know why ... until I found this open issue on the `tao` repository: https://github.com/tauri-apps/tao/issues/307 [Tao](https://github.com/tauri-apps/tao) is the Rust library Tauri uses to create and manage windows. And according to that issue, global shortcuts don't work properly on Linux, that's why it's not working for me!

So if I want to continue working on this application, I need to implement a workaround for shortcuts to work on Ubuntu. That's what I will be doing in the next blog post. See ya!