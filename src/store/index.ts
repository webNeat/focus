import {Store} from 'redux'
import {Actions, create} from 'redux-neat'
import {useSelector as originalUseSelector} from 'react-redux'
import {State} from './types'
import * as handlers from './handlers'

let savedState = localStorage.getItem('state')
let initialState: State = savedState
  ? JSON.parse(savedState)
  : {
      tasks: [],
      cursor: {zone: 'add-task'},
    }

const {store, actions} = create(initialState, handlers) as {store: Store<State>; actions: Actions<typeof handlers>}

store.subscribe(() => {
  localStorage.setItem('state', JSON.stringify(store.getState()))
})

export * from './types'
export {store, actions}
export function useSelector<R>(selector: (x: State) => R, fn?: (a: R, b: R) => boolean) {
  return originalUseSelector(selector, fn)
}
