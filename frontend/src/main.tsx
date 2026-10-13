import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { AuthProvider } from './features/auth/AuthContext'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
