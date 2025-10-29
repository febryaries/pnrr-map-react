import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Determine basename based on environment
// In development or when not deployed to /pnrr-dashboard/, use empty basename
// In production with /pnrr-dashboard/ path, use the basename
const getBasename = () => {
  // Check if we're running in development mode
  if (import.meta.env.DEV) {
    return ''
  }
  
  // In production, check if the current pathname starts with /pnrr-dashboard
  // If it does, use the basename, otherwise use empty string
  const pathname = window.location.pathname
  if (pathname.startsWith('/pnrr-dashboard')) {
    return '/pnrr-dashboard'
  }
  
  // Default to empty for local development or if path doesn't match
  return ''
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
