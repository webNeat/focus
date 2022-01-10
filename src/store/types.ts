export type Task = {
  content: string
  isDone: boolean
}

export type AddTaskCursor = {
  zone: 'add-task'
}
export type TasksCursor = {
  zone: 'tasks'
  action: 'select' | 'edit'
  taskIndex: number
}
export type Cursor = AddTaskCursor | TasksCursor

export type State = {
  tasks: Task[]
  cursor: Cursor
}
