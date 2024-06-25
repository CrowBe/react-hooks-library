import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import useSearchParamsState from './hooks/useSearchParamsState'
import { useCallback } from 'react'

function App() {
  const [query, setQuery] = useSearchParamsState({
    count: {default: 1, type: 'number', required: true}
  })
  console.log(query)
  const incrementCount = useCallback(() => setQuery('count', query.count + 1), [query, setQuery])
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={incrementCount}>
          count is {query.count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
