import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { AuthProvider } from './api/AuthContext'
import { ThemeProvider } from './api/ThemeContext'
import "ol/ol.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
  </StrictMode>,
)
