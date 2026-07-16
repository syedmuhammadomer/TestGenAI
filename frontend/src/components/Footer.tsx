import React from 'react'
import { Zap, Github, Linkedin, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Zap size={16} strokeWidth={2} />
              </div>
              <span className="text-white">TestGen AI</span>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Empowering QA teams with intelligent, automated test case generation. Ship faster with confidence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-primary-200 transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-200 transition">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-200 transition">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-6">Product</h4>
            <div className="space-y-3">
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Features</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Integrations</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Pricing</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Changelog</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-6">Resources</h4>
            <div className="space-y-3">
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Documentation</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">API Reference</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Blog</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Community</a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-6">Legal</h4>
            <div className="space-y-3">
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-primary-600 text-sm transition block">Cookie Policy</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-slate-500 text-sm">© 2026 TestGen AI Inc. All rights reserved.</div>
          <div className="text-slate-500 text-sm mt-4 md:mt-0 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
