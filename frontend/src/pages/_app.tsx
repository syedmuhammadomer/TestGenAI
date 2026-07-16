import type { AppProps } from 'next/app'
import axios from 'axios'
import { ProjectProvider } from '@/context/ProjectContext'
import { ThemeProvider } from '@/context/ThemeContext'
import '../styles/globals.css'

// Attach auth token to every outgoing axios request
axios.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

// Redirect to login on 401 responses — but never when already on a public page
const PUBLIC_PATHS = ['/login', '/register', '/verify-otp', '/admin/login']
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      const isPublic = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))
      if (!isPublic) {
        localStorage.removeItem('authToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <Component {...pageProps} />
      </ProjectProvider>
    </ThemeProvider>
  )
}
