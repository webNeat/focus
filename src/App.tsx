import React from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'

function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
      setContent('')
      await invoke('hide_window')
    }
  }
  return (
    <input
      type="text"
      autoFocus={true}
      value={content}
      onChange={e => setContent(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-[800px] h-[80px] bg-[#222] text-2xl text-white px-6"
    />
  )
}

export default App
