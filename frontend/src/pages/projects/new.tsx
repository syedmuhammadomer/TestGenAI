'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { Upload } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    if (err.response?.data?.message) {
      return err.response.data.message
    }
    if (err.message) {
      return err.message
    }
  }
  return 'Unable to queue the project. Please try again.'
}

export default function NewProjectPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')
  const [srsFile, setSrsFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }
    if (!srsFile) {
      setError('Please upload an SRS document')
      return
    }

    setError('')
    setMessage('Uploading the SRS document...')
    setProgress(20)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('projectName', projectName.trim())
    formData.set('srsDocument', srsFile)

    try {
      await axios.post(`${API_BASE_URL}/api/projects`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProgress(70)
      setMessage('Project queued for AI review. You will be notified once ready.')
      setProjectName('')
      setSrsFile(null)
      setTimeout(() => {
        router.push('/projects')
      }, 800)
    } catch (err) {
      console.error('Failed to create project', err)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
      setProgress(100)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">New Project</p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-2">Create a project from your SRS</h1>
            <p className="text-sm text-slate-500 mt-2">
              Upload a PDF or Word document and we will extract features, user stories, and test cases automatically.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600 font-medium">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="E.g. Inventory Platform"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600 font-medium">Upload SRS</label>
            <div className="relative group">
              <div
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition ${
                  srsFile ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(event) => setSrsFile(event.target.files?.[0] || null)}
                />
                <Upload className="w-8 h-8 mb-2 text-slate-500" />
                <p className="text-sm text-slate-500">
                  {srsFile ? srsFile.name : 'Click to upload PDF, DOC, or DOCX'}
                </p>
              </div>
            </div>
          </div>

          {progress > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">{message}</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-primary-500 to-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/projects')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              Queue Project
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
