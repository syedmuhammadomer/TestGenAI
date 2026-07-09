import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Backlogs from '@/components/Backlogs'
import { useProjectContext } from '@/context/ProjectContext'

export default function BacklogsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { selectedProject } = useProjectContext()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-600 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Layout>
      <Backlogs selectedProject={selectedProject} />
    </Layout>
  )
}
