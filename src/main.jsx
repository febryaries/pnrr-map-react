import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Determine basename based on environment
// In development or when not deployed to /pnrr-dashboard/, use empty basename
// In production with /pnrr-dashboard/ path, use the basename
const getBasename = () => {
  // Always use /pnrr-dashboard basename to match production
  // This ensures consistent behavior in dev and prod
  return '/pnrr-dashboard'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
