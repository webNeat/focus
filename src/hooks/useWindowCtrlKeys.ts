import React from 'react'
import {Callback, createHandler} from 'ctrl-keys'
import {Binding, KeysSequence} from './types'

const handler = createHandler()
window.addEventListener('keydown', (event) => {
  if (handler.handle(event as any)) {
    event.preventDefault()
    event.stopPropagation()
  }
})

export function useWindowCtrlKeys(...bindings: Binding[]) {
  const deps = bindings.reduce((a, b) => a.concat(b), [])
  React.useEffect(() => {
    const splittedBindings = bindings.map((binding) => {
      const fn = binding[binding.length - 1] as Callback
      const sequence = binding.slice(0, -1) as KeysSequence
      return [sequence, fn] as const
    })
    for (const [sequence, fn] of splittedBindings) {
      handler.add(sequence, fn)
    }
    return () => {
      for (const [sequence, fn] of splittedBindings) {
        handler.remove(sequence, fn)
      }
    }
  }, deps)
}

export function useWindowCtrlKey(...binding: Binding) {
  return useWindowCtrlKeys(binding)
}

export function useDisableWindowCtrlKeys(...sequences: KeysSequence[]) {
  const deps = sequences.reduce((a, b) => a.concat(b), [])
  React.useEffect(() => {
    for (const sequence of sequences) {
      handler.disable(sequence)
    }
    return () => {
      for (const sequence of sequences) {
        handler.enable(sequence)
      }
    }
  }, deps)
}

export function useDisableWindowCtrlKey(...sequence: KeysSequence) {
  React.useEffect(() => {
    handler.disable(sequence)
    return () => {
      handler.enable(sequence)
    }
  }, sequence)
}
