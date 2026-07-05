'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion';


import Navigation from '../components/Navigation'
import ButtonPrimary from '../components/ButtonPrimary';
import ButtonSpecial from '../components/ButtonSpecial';
import Footer from '../components/Footer';
import ContactMain from '../components/ContactMain';
import CallBack from '../components/CallBack';
import { useRouter } from 'next/navigation';


export default function Page() {
    const router = useRouter();


    const heroVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const [contactType, setContactType] = useState(0)


    const renderContact = () => {
        switch (contactType) {
            case 0:
                return <ContactMain contactType={contactType} setContactType={setContactType} />;
            case 1:
                return <CallBack contactType={contactType} setContactType={setContactType} />;
            default:
                return null;
        }
    }
    return (
        <div className='flex flex-col justify-between h-screen container-componen bg-primary'>
            <Navigation page={'Contact'} />
            {renderContact()}
            {/* <ContactMain /> */}
            <Footer />
        </div>
    )
}
