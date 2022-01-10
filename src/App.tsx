import {Provider} from 'react-redux'
import {Tasks} from './pages/Tasks'
import {store} from './store'

export function App() {
  return (
    <Provider store={store}>
      <Tasks />
    </Provider>
  )
}
