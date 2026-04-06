import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply persisted theme synchronously before render to avoid flash
const storedState = localStorage.getItem('app-store')
if (storedState) {
  try {
    const parsed = JSON.parse(storedState)
    if (parsed.state?.theme) {
      document.documentElement.className = parsed.state.theme
    }
  } catch (e) {
    // Ignore parse errors, fallback to light mode
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
