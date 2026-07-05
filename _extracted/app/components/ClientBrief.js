'use client';

import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion';

export default function ClientBrief() {
    const logos = [
        { src: '/gig1.png' },
        { src: '/gew.png' },
        { src: '/infinet.png' },
        { src: '/uds.png' },
        { src: '/smile.png' },
        { src: '/chris.png' },
        { src: '/giw.png' },
    ];

    const scrollVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.2 } },
    };

    return (
        <motion.div
            className='container-section flex-wrap flex w-[90%] md:w-[80%] mx-auto text-white'
            initial="hidden"
            animate="visible"
            variants={scrollVariants}
        >
            <div className='w-full mx-auto md:w-[15%]'>
                <motion.p
                    className='text-secondary text-xs mt-6'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.5 } }}
                >
                    Our Esteemed Clients
                </motion.p>
            </div>

            <div className='w-[81%] hidden md:flex overflow-hidden'>
                <motion.div
                    className='py-4 flex flex-wra items-center animate-scroll gap-8'
                    animate={{ x: ['0%', '-10%'] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                >
                    {logos.map((logo, index) => (
                        <Image
                            src={logo.src}
                            width={70}
                            height={40}
                            key={`logo-${index}`}
                            alt={`Client logo ${index + 1}`}
                            className='h-auto'
                        />
                    ))}
                    {logos.map((logo, index) => (
                        <Image
                            src={logo.src}
                            width={70}
                            height={40}
                            key={`logo-duplicate-${index}`}
                            alt={`Client logo duplicate ${index + 1}`}
                            className='h-auto'
                        />
                    ))}
                </motion.div>
            </div>

            <div className='w-[98%] md:w-[81%] py-8 md:hidden overflow-hidden'>
                <motion.div
                    className='py-4 flex flex-wra overflow w-full items-center animate-scroll gap-8'
                    animate={{ x: ['0%', '-100%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                >
                    {logos.map((logo, index) => (
                        <Image
                            src={logo.src}
                            width={70}
                            height={40}
                            key={`logo-${index}`}
                            alt={`Client logo ${index + 1}`}
                            className='h-auto'
                        />
                    ))}
                    {/* {logos.map((logo, index) => (
                        <Image
                            src={logo.src}
                            width={70}
                            height={40}
                            key={`logo-duplicate-${index}`}
                            alt={`Client logo duplicate ${index + 1}`}
                            className='h-auto'
                        />
                    ))} */}
                </motion.div>
            </div>


        </motion.div>
    );
}
