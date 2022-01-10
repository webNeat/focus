import {TasksCursor} from '..'
import {State} from '../types'
import {moveToNextTask, moveToPreviousTask} from './cursor'

export function add(state: State, content: string) {
  state.tasks = [...state.tasks, {content, isDone: false}]
  return state
}

export function edit(state: State, index: number, content: string) {
  if (0 <= index && index < state.tasks.length) {
    state.tasks = [...state.tasks.slice(0, index), {...state.tasks[index], content}, ...state.tasks.slice(index + 1)]
  }
  return state
}

export function toggle(state: State, index: number) {
  if (0 <= index && index < state.tasks.length) {
    state.tasks = [
      ...state.tasks.slice(0, index),
      {...state.tasks[index], isDone: !state.tasks[index].isDone},
      ...state.tasks.slice(index + 1),
    ]
  }
  return state
}

export function toggleSelected(state: State) {
  if (state.cursor.zone === 'tasks') {
    return toggle(state, state.cursor.taskIndex)
  }
  return state
}

export function remove(state: State, index: number) {
  if (0 <= index && index < state.tasks.length) {
    state.tasks = [...state.tasks.slice(0, index), ...state.tasks.slice(index + 1)]
  }
  return state
}

export function removeSelected(state: State) {
  if (state.cursor.zone === 'tasks') {
    return remove(state, state.cursor.taskIndex)
  }
  return state
}

export function swapSelectedWithNext(state: State) {
  const tasksCount = state.tasks.length
  const taskIndex = (state.cursor as TasksCursor).taskIndex
  if (state.cursor.zone === 'tasks' && taskIndex < tasksCount - 1) {
    const tasks = [...state.tasks]
    ;[tasks[taskIndex], tasks[taskIndex + 1]] = [tasks[taskIndex + 1], tasks[taskIndex]]
    state.tasks = tasks
    moveToNextTask(state)
  }
  return state
}

export function swapSelectedWithPrevious(state: State) {
  const taskIndex = (state.cursor as TasksCursor).taskIndex
  if (state.cursor.zone === 'tasks' && taskIndex > 0) {
    const tasks = [...state.tasks]
    ;[tasks[taskIndex], tasks[taskIndex - 1]] = [tasks[taskIndex - 1], tasks[taskIndex]]
    state.tasks = tasks
    moveToPreviousTask(state)
  }
  return state
}
