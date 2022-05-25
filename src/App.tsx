import React from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { process } from '@tauri-apps/api'

function App() {
  const [content, setContent] = React.useState('')
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await invoke('add_task', { content })
      process.exit()
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
