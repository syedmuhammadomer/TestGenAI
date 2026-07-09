'use client'
import { useState } from 'react'
import { Check, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '@/components/Button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { projects } from '@/data/projects'

export default function Pricing() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const card = {
    hidden: { y: 50, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  }

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals and small teams getting started',
      features: [
        'Up to 50 test cases per month',
        'Basic AI test generation',
        'Email support',
        'API documentation access',
        'Community forum access'
      ],
      limitations: [
        'Limited to 2 projects',
        'Basic reporting only'
      ],
      buttonText: 'Get Started Free',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'per month',
      description: 'Ideal for growing teams and professional QA engineers',
      features: [
        'Unlimited test cases',
        'Advanced AI test generation',
        'Priority email support',
        'Advanced reporting & analytics',
        'API access with higher limits',
        'Custom test templates',
        'Integration with CI/CD tools',
        'Team collaboration features'
      ],
      limitations: [],
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary' as const,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large organizations with advanced testing needs',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Phone & priority support',
        'Custom AI model training',
        'Advanced security features',
        'SSO integration',
        'Custom integrations',
        'On-premise deployment option',
        'Compliance reporting'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary' as const,
      popular: false
    }
  ]

  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0]

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero Section */}
      <section className="py-24 px-6 lg:px-12 relative overflow-hidden">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-block mb-6 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full">
              <span className="text-primary-700 text-sm font-semibold flex items-center gap-2">
                <Star size={16} />
                Choose Your Plan
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900">
              <span className="gradient-text">Simple, Transparent</span>
              <br />
              Pricing for Everyone
            </h1>

            <p className="text-slate-500 max-w-2xl mx-auto text-lg mb-12">
              Choose the perfect plan for your testing needs. All plans include our core AI-powered test generation technology.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Project dropdown for admin view */}
      <section className="px-6 lg:px-12 -mt-16">
        <div className="container mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-elevated">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Admin project switcher</p>
                <h3 className="text-2xl font-semibold text-slate-900 mt-1">Inspect every project before choosing a plan</h3>
                <p className="text-slate-500 text-sm">Pick a project to see its coverage, requirements, and team stats right here.</p>
              </div>
              <div className="min-w-[240px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Active project</label>
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <p className="text-slate-700 text-lg font-medium">{selectedProject?.description}</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${selectedProject?.statusColor}`}>{selectedProject?.status}</span>
                  <span className="text-xs text-slate-500">Last updated {selectedProject?.date}</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Test coverage</div>
                  <div className="w-full bg-slate-100 h-2 rounded-full">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent"
                      style={{ width: `${selectedProject?.coverage ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedProject?.coverage}% coverage so far</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                {[{
                  label: 'Requirements',
                  value: selectedProject?.requirements
                }, {
                  label: 'Scenarios',
                  value: selectedProject?.scenarios
                }, {
                  label: 'Test Cases',
                  value: selectedProject?.testCases
                }, {
                  label: 'Members',
                  value: selectedProject?.members
                }].map((item) => (
                  <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 pt-16 px-6 lg:px-12">
        <div className="container mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={card}
                className={`relative group ${
                  plan.popular
                    ? 'md:scale-105 lg:scale-110'
                    : ''
                } transition-all duration-300`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-primary-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-card">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`relative h-full p-8 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white border-primary-200 shadow-elevated'
                    : 'bg-white border-slate-200 shadow-soft hover:shadow-card hover:border-slate-300'
                }`}>
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <p className="text-slate-500 text-sm mb-6">{plan.description}</p>

                      <div className="mb-6">
                        <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                        <span className="text-slate-500 ml-2">/{plan.period}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <Check size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-600 text-sm">{feature}</span>
                        </div>
                      ))}

                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-start gap-3 opacity-60">
                          <div className="w-4 h-4 rounded-full bg-slate-200 mt-0.5 flex-shrink-0"></div>
                          <span className="text-slate-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      variant={plan.buttonVariant}
                      className="w-full"
                      size="lg"
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 lg:px-12 bg-slate-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Got questions? We&apos;ve got answers. Can&apos;t find what you&apos;re looking for? Contact our support team.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                question: "Can I change my plan at any time?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
              },
              {
                question: "Is there a free trial?",
                answer: "Absolutely! All paid plans come with a 14-day free trial. No credit card required to start."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise customers."
              },
              {
                question: "Do you offer discounts for non-profits?",
                answer: "Yes! We offer special pricing for educational institutions, non-profits, and open-source projects. Contact us for details."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft"
              >
                <h3 className="text-slate-900 font-semibold mb-2">{faq.question}</h3>
                <p className="text-slate-500">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
              Ready to Transform Your Testing?
            </h2>
            <p className="text-slate-500 text-lg mb-8">
              Join thousands of QA engineers who are saving hours every week with AI-powered test generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
