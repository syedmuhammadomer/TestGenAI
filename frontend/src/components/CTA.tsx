import React from 'react'
import Button from './Button'

export default function CTA() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-surface-alt">
      <div className="container mx-auto">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-16 text-center max-w-3xl mx-auto shadow-elevated">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">Ready to automate your QA workflow?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join 10,000+ developers and QA engineers who are saving hours every week.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="!bg-slate-900 !text-white hover:!bg-slate-800">
              Get Started for Free
            </Button>
            <Button variant="outline" size="lg" className="!border-primary-300 !bg-transparent !text-white hover:!bg-white/10">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
