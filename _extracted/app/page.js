import React from 'react'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import ClientBrief from './components/ClientBrief'
import Expertise from './components/Expertise'
import Footer from './components/Footer'

export default function page() {
  return (
    <div className='container-compon main- bg-primary flex flex-col justify-between h-screen'>

      <div className='py-4 bg-primary'>
        <Navigation page={'Home'} />
      </div>

      <div className='w-full bg-primary'>
        <Hero />
      </div>
      <div className='w-full py-8 bg-primary/95'>
        <ClientBrief />
      </div>


      {/* <div className='w-full bg-primary py-8'>
        <Expertise />
      </div> */}

      <Footer />

    </div>
  )
}
