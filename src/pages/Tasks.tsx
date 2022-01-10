import React from 'react'
import cn from 'classnames'
import {CheckCircleIcon} from '@heroicons/react/solid'
import {useSelector, Task, actions, TasksCursor} from '../store'
import {useCtrlKey, useDisableWindowCtrlKeys, useWindowCtrlKeys} from '../hooks'

export function Tasks() {
  const state = useSelector((x) => x)
  useWindowCtrlKeys(
    ['up', actions.cursor.moveToPreviousTask],
    ['down', actions.cursor.moveToNextTask],
    ['ctrl+up', actions.tasks.swapSelectedWithPrevious],
    ['ctrl+down', actions.tasks.swapSelectedWithNext],
    ['enter', actions.cursor.editTask],
    ['space', actions.tasks.toggleSelected],
    ['delete', actions.tasks.removeSelected],
    ['/', actions.cursor.moveToAddTask],
    ['esc', actions.cursor.moveToTasks]
  )
  return (
    <>
      <PressedKeys />
      <div className="container mx-auto">
        {state.cursor.zone === 'add-task' && <AddTask />}
        {state.tasks.map((task, i) => (
          <TaskBlock key={i} index={i} {...task} />
        ))}
      </div>
    </>
  )
}

function PressedKeys() {
  const [key, setKey] = React.useState(' ')
  const onKeyDown = (e: KeyboardEvent) => {
    let eventKey = []
    if (e.ctrlKey) eventKey.push('ctrl')
    if (e.altKey) eventKey.push('alt')
    if (e.shiftKey) eventKey.push('shift')
    if (e.metaKey) eventKey.push('meta')
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      eventKey.push(e.key == ' ' ? 'Space' : e.key)
    }
    setKey(eventKey.join('+'))
  }
  React.useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  return <div className="h-16 p-4 bg-black text-white text-2xl text-center">{key}</div>
}

function AddTask() {
  const textarea = React.useRef<HTMLTextAreaElement>()
  React.useEffect(() => {
    textarea.current.focus()
  }, [])
  useDisableWindowCtrlKeys(['/'], ['up'], ['down'], ['left'], ['right'], ['space'])
  const handle = useCtrlKey('enter', () => {
    actions.tasks.add(textarea.current.value)
    textarea.current.value = ''
  })
  return (
    <div className="m-2 p-3 border rounded-lg bg-white border-gray-300 shadow-md">
      <textarea
        ref={textarea}
        onKeyDown={handle}
        placeholder="New task ..."
        className="w-full outline-none resize-none"
      ></textarea>
    </div>
  )
}

type TaskBlockProps = Task & {index?: number}
function TaskBlock({index, content, isDone}: TaskBlockProps) {
  const cursor = useSelector((x) => x.cursor) as TasksCursor
  const selected = cursor.taskIndex === index
  const editing = selected && cursor.action === 'edit'
  return (
    <div
      className={cn('m-2 p-3 border rounded-lg', {
        'border-gray-300': !isDone,
        'border-green-300': isDone,
        'shadow-md': selected,
        'bg-gray-100': !isDone && !selected,
        'bg-white': !isDone && selected,
        'bg-green-200': isDone && !selected,
        'bg-green-100': isDone && selected,
      })}
    >
      {!editing && (
        <p className="flex justify-between">
          <span>{content}</span>
          {isDone && <CheckCircleIcon className="w-6 h-6 fill-green-800" />}
        </p>
      )}
      {editing && <EditTask index={index} content={content} />}
    </div>
  )
}

function EditTask({index, content}: Pick<TaskBlockProps, 'index' | 'content'>) {
  const textarea = React.useRef<HTMLTextAreaElement>()
  React.useEffect(() => {
    textarea.current.value = content
    textarea.current.focus()
    textarea.current.selectionStart = textarea.current.value.length
  }, [])
  useDisableWindowCtrlKeys(['/'], ['up'], ['down'], ['left'], ['right'], ['space'])
  const handle = useCtrlKey('enter', () => {
    actions.tasks.edit(index, textarea.current.value)
    actions.cursor.selectTask()
  })
  return (
    <textarea ref={textarea} onKeyDown={handle} className="w-full bg-transparent outline-none resize-none"></textarea>
  )
}
