import type { AppProps } from 'next/app'
import { ProjectProvider } from '@/context/ProjectContext'
import { ThemeProvider } from '@/context/ThemeContext'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <Component {...pageProps} />
      </ProjectProvider>
    </ThemeProvider>
  )
}
