'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ButtonPrimary from './ButtonPrimary';


export default function Hero() {
    const heroVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };
    const [contactType, setContactType] = useState(1)


    return (
        <motion.div
            className='container-section-start md:py-8 w-[90%] md:w-[80%] mx-auto text-white'
            initial="hidden"
            animate="visible"
            variants={heroVariants}
        >
            <div className='w-[90%] md:w-[15%] mb-4 md:mb-0'>
                <motion.p
                    className='text-secondary w-[50%] md:w-full text-xs mt-0 md:mt-6'
                    initial="hidden"
                    animate="visible"
                    variants={heroVariants}
                >
                    Solving challenges, transforming organisations.
                </motion.p>
            </div>

            <div className='w-[81%] hidden md:block'>
                <motion.h1
                    className='font-bold text-5xl leading-4'
                    initial="hidden"
                    animate="visible"
                    variants={heroVariants}
                >
                    The Digital Experts <br /> For Organisations & Institutions
                </motion.h1>
                <p className='text-sm mt-4 w-[60%]'>
                    We specialize in mobile and web development, crafting digital marketing
                    strategies, and delivering engaging graphic and video design services.
                </p>

                <div>
                    <ButtonPrimary cType={null} setContactType={setContactType} path={'/contact'} label={'Start A Project'} />
                </div>
            </div>

            <div className='w-[90%] md:hidden'>
                <motion.h1
                    className='font-bold text-4xl leading-4'
                    initial="hidden"
                    animate="visible"
                    variants={heroVariants}
                >
                    The Digital Experts <br /> For Organisations & Institutions
                </motion.h1>
                <p className='text-sm mt-4 w-[90%]  '>
                    We specialize in mobile and web development, crafting digital marketing
                    strategies, and delivering engaging graphic and video design services.
                </p>

                <div>
                    <ButtonPrimary cType={null} setContactType={setContactType} path={'/contact'} label={'Start A Project'} />
                </div>
            </div>
        </motion.div>
    );
}
