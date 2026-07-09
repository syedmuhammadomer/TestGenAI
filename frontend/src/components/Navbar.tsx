import React from 'react'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import Button from './Button'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Zap size={18} strokeWidth={2} />
          </div>
          <span className="text-slate-900">TestGen AI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Integrations</a>
          <a href="#" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Features</a>
          <a href="#" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">How it Works</a>
          <Link href="/pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
