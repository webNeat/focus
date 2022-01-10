import React, {KeyboardEvent as ReactKeyboardEvent} from 'react'
import {Callback, createHandler} from 'ctrl-keys'
import {Binding, KeysSequence} from './types'

export function useCtrlKeys(...bindings: Binding[]) {
  const deps = bindings.reduce((a, b) => a.concat(b), [])
  const handler = React.useMemo(() => {
    const handler = createHandler()
    for (const binding of bindings) {
      const fn = binding[binding.length - 1] as Callback
      const sequence = binding.slice(0, -1) as KeysSequence
      handler.add(sequence, fn)
    }
    return handler
  }, deps)

  const handle = <T>(event: ReactKeyboardEvent<T>) => {
    if (handler.handle(event as any)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return handle
}

export function useCtrlKey(...binding: Binding) {
  return useCtrlKeys(binding)
}
