Hello 👋,

In this article, I will describe the steps I went through to create a small desktop application to help me focus on my daily tasks.

# Contents

- [The focus problem](#the-focus-problem)
- [The idea of the application](#the-idea-of-the-application)
- [Setting up the project](#setting-up-the-project)
- [Creating the UI](#creating-the-ui)
- [Calling Rust functions from the frontend](#calling-rust-functions-from-the-frontend)
- [Customizing the tasks file path](#customizing-the-tasks-file-path)
- [Customizing the window](#customizing-the-window)
- [Closing the application after adding the task](#closing-the-application-after-adding-the-task)
- [Compiling, installing and using the application](#compiling-installing-and-using-the-application)

# The focus problem

One of my goals is to create the ultimate time management tool that will solve all my productivity issues, but let's start with one small problem for now.
When I am working on a task, I often get interrupted by other tasks that should be done (a new task is assigned to me, I remember something that I should do, ...), most of the time, the new task is not that urgent and can wait until I finish my current one. But it gets me distracted and sometimes I find myself prioritizing it over the current task only to not forget about it. Then resuming the original task becomes hard because I lost focus. To solve this problem I needed a way to quickly log interrupting tasks as they popup and forget about them until I finish my current task.

# The idea of the application

- I am working on something ... an interrupting idea/task appears.
- I hit a custom shurtcut on my keyboard then a text input appears in the center of the screen.
- I type a quick description of the interrupting idea/task, hit enter and the text input disapears.
- I continue my work normally.
...
- When I finish, I open a predefined file and find all the ideas/tasks I typed written inside it.

# Setting up the project

What I am trying to build here is a desktop application, but I want to use web technologies (at least for the UI). The popular tool to do that is [Electron](https://www.electronjs.org), but I started recently learning Rust and [Tauri](https://tauri.studio/) seems like a good tool to try. So I will be using it with React for the frontend and Tailwind for styling.

I followed the instructions on [Tauri's prerequisites page](https://tauri.studio/v1/guides/getting-started/prerequisites) to setup Rust and Node on my system, then I run `yarn create tauri-app` to create the project. I named the project `focus` and chose the `create-vite` receipe for the UI and agreed to install `@tauri-apps/api`. Then chose the `react-ts` template of `create-vite`:

![Create Tauri project with Vite react-ts template](https://raw.githubusercontent.com/webNeat/focus/main/story/1-creating-a-popup/1-create-project.gif)

Tauri created the project and installed the dependencies. Let's take a look at the files structure:

```
src/
  main.tsx  <- entry point of JS/TS
  ... other UI files here
src-tauri/
  icons/           <- icons of different sizes
  src/
    main.rs        <- entry point for the application
  target/          <- the compiled and bundles files
  Cargo.toml       <- like package.json for Rust
  Cargo.lock       <- like yarn.lock
  tauri.conf.json  <- config file for Tauri
index.html         <- entry point of the UI
package.json
yarn.lock
tsconfig.json
vite.config.ts     <- config file for Vite
```

Now running the `yarn tauri dev` should start the app. This will take some time as Rust compiles the code for the first time, the following executions will be fast.

The final step of the setup was to add Tailwind to the project, I did that by following [the official docs](https://tailwindcss.com/docs/guides/vite)

# Creating the UI

For the UI, all I need is a text input where I will type the task then hit Enter to save it. So I changed the `App` component code to the following:

```tsx
function App() {
  return <input
    type="text"
    className="w-[800px] h-[80px] bg-[#222] text-2xl text-white px-6"
  />
}
```
Note that I am using Tailwind's [arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values) syntax to have a dark gray `800px/80px` input.

When I type some text in this input then hit `Enter`, I want that text to be appended to a file somewhere. Let's start by saving the text in a state and logging it when `Enter` is pressed:

```tsx
function App() {
  const [content, setContent] = React.useState('')
  return (
    <input
      type="text"
      value={content}
      onChange={e => setContent(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && console.log(content)}
      className="w-[800px] h-[80px] bg-[#222] text-2xl text-white px-6"
    />
  )
}
```

![Add state for the input content](https://raw.githubusercontent.com/webNeat/focus/main/story/1-creating-a-popup/2-add-state.gif)

# Calling Rust functions from the frontend

The next step is to write a Rust function that will receive the input content and append it to a file. After reading the [Calling Rust from the frontend](https://tauri.studio/v1/guides/features/command/) documentation page, I changed the `src-tauri/src/main.rs` to the following:

__Warning: I am new to Rust, so I may be doing many things wrong in this code__

```rs
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs::OpenOptions;
use std::io::prelude::*;

#[tauri::command]
fn add_task(content: String) {
  let mut file = OpenOptions::new()
    .create(true)
    .append(true)
    .open("../tasks.txt")
    .expect("Error while opening the tasks file");
  writeln!(file, "{}", content).expect("Error while writing in the tasks file");
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![add_task])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

Then I modified the `App` component to call that function when `Enter` is pressed:

```tsx
function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
    }
  }
  return (
    <input
      type="text"
      value={content}
      onChange={e => setContent(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-[800px] h-[80px] bg-[#222] text-2xl text-white px-6"
    />
  )
}
```

Now when typing some text and hiting `Enter`, the entered text is added to the `tasks.txt` file.

![Append content to file](https://raw.githubusercontent.com/webNeat/focus/main/story/1-creating-a-popup/3-append-to-file.gif)

# Customizing the tasks file path

Note that this file is created in the root of the project while the path in the Rust code is `../tasks.txt`, this is because the app is executed inside the `src-tauri` directory, so any relative path will be relative to that directory. It will be better to use an absolute path and let the user define it. The easiest way I could think of to define it is via an environment variable, let's call it `FOCUS_TASKS_PATH`. 

So I added this variable to my `.zshrc` then updated the Rust code:

```rs
// ...
use std::env;

#[tauri::command]
fn add_task(content: String) {
  let path = env::var("FOCUS_TASKS_PATH") // read the env var
    .expect("The 'FOCUS_TASKS_PATH' env variable was not found!"); 
  let mut file = OpenOptions::new()
    .create(true)
    .append(true)
    .open(path)                           // <- use it here
    .expect("Error while opening the tasks file");
  writeln!(file, "{}", content).expect("Error while writing in the tasks file")
}
```

# Customizing the window

The initial idea was to have a popup, something like Spotlight on macOS, but what we have now in a browser window! Luckily, Tauri allows us to tweak the window using the `src-tauri/tauri.conf.json` file. The initial window configuration was:

```json
{
  "fullscreen": false,
  "height": 600,
  "resizable": true,
  "title": "Focus",
  "width": 800
}
```

I replaced it with

```json
{
  "fullscreen": false,
  "width": 800,         // the width of the input
  "height": 80,         // the height of the input
  "title": "Focus",
  "resizable": false,
  "center": true,         // position it in the center of the screen
  "decorations": false    // remove the title bar
}
```

The result looks good :)

![The application styled as a popup](https://raw.githubusercontent.com/webNeat/focus/main/story/1-creating-a-popup/4-popup.gif)

# Closing the application after adding the task

Now I want the popup to disapear when I hit `Enter`, so let's add a `process.exit()` in our `App` component (This could also be added on the `add_task` Rust function).

```tsx
import { process } from '@tauri-apps/api'

function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
      process.exit()
    }
  }
  //...
}
```

Now the popup is closed when `Enter` is pressed :)

# Compiling, installing and using the application

I think we have the alpha version of the application ready now, let's build it

```
yarn tauri build
```

First the command failed with this message

```
Error You must change the bundle identifier in `tauri.conf.json > tauri > bundle > identifier`. The default value `com.tauri.dev` is not allowed as it must be unique across applications.
```

Setting the identifier to `dev.webneat.focus` solved the problem.

The compilation took a while then I had the following files generated (I am using Ubuntu):

```
src-tauri/target/release/bundle/
  deb/focus_0.1.0_amd64.deb
  appimage/focus_0.1.0_amd64.AppImage
```

Since the AppImage is easier to use (no installation needed), I just moved it to my `bin` directory and named it `focus`:

```
sudo mv src-tauri/target/release/bundle/appimage/focus_0.1.0_amd64.AppImage /usr/bin/focus
```

Now runing the command focus on the terminal opens the popup :D

On Ubuntu, I can setup a new custom shortcut on the Keyboard settings. Now when I hit that shortcut anywhere, The popup appears, I type what I have in mind and hit `Enter` then continue what I was doing 🎉

