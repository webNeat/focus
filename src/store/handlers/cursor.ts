import {TasksCursor} from '..'
import {State} from '../types'
import {remove, toggle} from './tasks'

export function moveToAddTask(state: State) {
  state.cursor = {zone: 'add-task'}
  return state
}

export function moveToTasks(state: State) {
  state.cursor = {zone: 'tasks', action: 'select', taskIndex: 0}
  return state
}

export function moveToPreviousTask(state: State) {
  return moveToTaskWithIndex(state, (state.cursor as TasksCursor).taskIndex - 1)
}

export function moveToNextTask(state: State) {
  return moveToTaskWithIndex(state, (state.cursor as TasksCursor).taskIndex + 1)
}

export function moveToTaskWithIndex(state: State, taskIndex: number) {
  if (state.cursor.zone !== 'tasks') {
    return state
  }
  const count = state.tasks.length
  taskIndex = (taskIndex + count) % count
  state.cursor = {...state.cursor, taskIndex}
  return selectTask(state)
}

export function selectTask(state: State) {
  if (state.cursor.zone !== 'tasks') {
    return state
  }
  state.cursor.action = 'select'
  return state
}

export function editTask(state: State) {
  if (state.cursor.zone !== 'tasks') {
    return state
  }
  state.cursor.action = 'edit'
  return state
}
