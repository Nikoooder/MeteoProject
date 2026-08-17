import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { AuthProvider } from './api/AuthContext'
import { ThemeProvider } from './api/ThemeContext'
import "ol/ol.css";

// Service worker makes the application shell and viewed map tiles available
// after the first successful online visit.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js"));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
  </StrictMode>,
)
