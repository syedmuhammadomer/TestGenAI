import type { NextPage } from 'next'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Integrations from '../components/Integrations'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

const Home: NextPage = () => {
  return (
    <div className="bg-surface">
      <Navbar />
      <Hero />
      <Features />
      <Integrations />
      <CTA />
      <Footer />
    </div>
  )
}

export default Home
