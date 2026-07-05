import React from 'react'
import Expertise from '../components/Expertise'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export default function Page() {
    return (
        <div className='bg-primary flex flex-col justify-between h-screen'>

            <Navigation page={'Expertise'} />
            <Expertise />
            <Footer />
        </div>
    )
}
