import type { AppProps } from 'next/app'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { Toaster } from 'sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ProjectProvider } from '@/context/ProjectContext'
import { ThemeProvider } from '@/context/ThemeContext'
import '../styles/globals.css'

function RouteProgressBar() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const start = () => {
      setProgress(0)
      setVisible(true)
      let p = 0
      timerRef.current = setInterval(() => {
        // fast at first, slows down as it approaches 90%
        p += p < 30 ? 12 : p < 60 ? 6 : p < 80 ? 2 : 0.5
        if (p > 90) p = 90
        setProgress(p)
      }, 60)
    }
    const done = () => {
      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      setTimeout(() => setVisible(false), 300)
    }

    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', done)
    router.events.on('routeChangeError', done)
    return () => {
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', done)
      router.events.off('routeChangeError', done)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [router])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
          transition: progress === 100 ? 'width 0.1s ease, opacity 0.3s ease' : 'width 0.06s linear',
          opacity: progress === 100 ? 0 : 1,
          boxShadow: '0 0 8px rgba(20,184,166,0.6)',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  )
}

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
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}>
      <ThemeProvider>
        <ProjectProvider>
          <RouteProgressBar />
          <Component {...pageProps} />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181b',
                border: '1px solid #3f3f46',
                color: '#fafafa',
              },
            }}
            richColors
          />
        </ProjectProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
