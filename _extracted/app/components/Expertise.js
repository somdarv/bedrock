'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion';



export default function Expertise() {

    const heroVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };


    const expertise = [
        { title: 'UX & Product Design', content: 'We design user-friendly mobile apps, websites, and digital products that make navigation and interaction effortless. Our approach focuses on understanding your users and crafting experiences that meet their needs and exceed expectations.' },
        { title: 'Product Development', content: 'We handle the full process of building your digital products, including mobile app development, website creation, and software solutions. From initial planning to final launch, we ensure your product is effective and reliable.' },
        { title: 'Web Design', content: 'We create visually stunning websites with fast loading speeds, responsive layouts, and SEO optimization. Our designs focus on both aesthetics and functionality to help your business attract and retain customers.' },
        { title: 'Communication Design', content: 'We develop impactful marketing materials like brochures, social media graphics, brand guidelines, and advertising visuals. Our designs ensure your message is clear and resonates with your audience.' },

    ]

    const [activeItem, setActiveItem] = useState('')

    const handleExpertiseClick = (index) => {
        setActiveItem(activeItem === index ? null : index); // Toggle active item
    };



    return (
        <motion.div className='container-section-center flex flex-wrap w-[90%] md:w-[80%] mx-auto text-white'>
            <motion.div initial="hidden"
                animate="visible"
                variants={heroVariants} className='w-full md:w-[12%] '><p className='text-6xl'>*</p></motion.div>


            < motion.div className='w-full md:w-[84%] '>
                <motion.h1 initial="hidden"
                    animate="visible"
                    variants={heroVariants} className='font-bold text-3xl my-8'>Our Expertise</motion.h1>

                <motion.div initial="hidden"
                    animate="visible"
                    variants={heroVariants} className='my-4 border-y border-secondary/50 w-[90%] md:w-[60%] '>


                    {
                        expertise.map((expertise, index) => (
                            <motion.div initial="hidden"
                                animate="visible"
                                variants={heroVariants} key={index} >
                                <div
                                    className=' hover:bg-white/5  cursor-pointer  border-secondary/50 '>

                                    <div onClick={() => handleExpertiseClick(index)} className='flex items-center justify-between px-4'>
                                        <h1 className='font-semibold text-lg py-4'>{expertise.title}</h1>
                                        <p className='font-semibold text-xl'>
                                            {activeItem === index ? '-' : '+'}
                                        </p>
                                    </div>

                                    {activeItem === index && (
                                        <p className='my-1 pb-8 font-normal px-4 text-sm'>
                                            {expertise.content}
                                        </p>
                                    )}

                                    <div className='border-y border-secondary/50'></div>

                                </div>

                            </motion.div>
                        ))
                    }

                </motion.div>
            </motion.div>


        </motion.div >
    )
}
