'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion';


import Navigation from '../components/Navigation'
import ButtonPrimary from '../components/ButtonPrimary';
import ButtonSpecial from '../components/ButtonSpecial';
import Footer from '../components/Footer';


export default function ContactMain({ setContactType, contactType }) {
    const heroVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const clickFunction = () => {
        router.push(path);
        setContactType(1);
    }

    return (
        <div className='text-white w-[90%] md:w-[80%]   mx-auto container-section'>
            <motion.div initial="hidden"
                animate="visible"
                variants={heroVariants} className='w-full md:w-[12%] '><p className='text-6xl'>*</p></motion.div>


            <motion.div initial="hidden"
                animate="visible"
                variants={heroVariants} className='my-4  border-secondary/50 w-full md:w-[84%] '>

                <motion.h1 initial="hidden"
                    animate="visible"
                    variants={heroVariants} className='font-bold text-3xl my-8'>Contact
                </motion.h1>


                <motion.h1 initial="hidden"
                    animate="visible"
                    variants={heroVariants} className='font-bol text-lg w-full md:w-[60%] my-8'>

                    <p>Get in touch with us your way. Request a callback for a personal consultation, or connect instantly through WhatsApp.</p>

                    <div className='flex items-center gap-x-4 w-full '>
                        <ButtonPrimary cType={1} setContactType={setContactType} label={'Request A Call Back'} />
                        <ButtonSpecial cType={0} path={'https://wa.me/+233509886584'} setContactType={setContactType} label={"Chat On WhatsApp"} />
                    </div>


                </motion.h1>




            </motion.div>





        </div>

    )
}
