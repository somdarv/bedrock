'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';




export default function Navigation({ page }) {

    const router = useRouter();

    const menuItems = [
        { id: 1, label: 'Home', path: '/' },
        { id: 2, label: 'Expertise', path: '/expertise' },
        // { id: 3, label: 'Services', path: '/services' },
        { id: 4, label: 'Contact', path: '/contact' },
        // { id: 5, label: 'Enterprise', path: '/enterprise'},
    ]

    const [activeItem, setActiveItem] = useState(page);
    const [menuActive, setMenuActive] = useState(false)

    const handleNavigation = (item) => {
        setActiveItem(item.label);
        router.push(item.path);
    };
    const handleMenuClick = () => {
        setMenuActive(!menuActive);
    }


    const navVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };


    return (
        <motion.div
            className='flex relative items-center w-[90%] justify-between md:justify-start  md:w-[80%] py-8 mx-auto '
            initial="hidden"
            animate="visible"
            variants={navVariants}
        >
            <div className='w-[15%] flex-start  pl-4 md:pl-0'>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    className='text-mairo font-bold text-5xl text-white'
                >sahara
                </motion.button>


            </div>
            {/* menu section */}
            <div className='w-auto border-secondary/50 gap-x-4 items-center hidden md:flex   py-2 px-3'>
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item)}
                        className={`text-sm font-normal px-3 py-1 text-secondary flex pb-2 items-center justify-center  ${activeItem === item.label
                            ? ' text-secondary font-semibold  border-b-2' // Active item style
                            : 'font-normal' // Non-active item style
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>


            <div className='text-white md:hidden'>
                <button onClick={() => handleMenuClick()} className='w-10 h-10 rounded-full active:bg-gray-200  flex justify-center items-center'>
                    <Menu />
                </button>
            </div>

            {
                menuActive === true ?
                    (<div className='absolute text-white top-24  bg-primary w-full'>
                        <div className='w-[%]  mx-auto'>
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(item)}
                                    className={`text-sm font-normal px-3 border-b border-b-gray-500 my-2 py-4 w-full text-secondary flex pb- items-center justify-center  ${activeItem === item.label
                                        ? ' text-secondary bg-[#363535] py-4 font-semibold  border-b-2 border-b-white' // Active item style
                                        : 'font-normal' // Non-active item style
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>) : ('')
            }

        </motion.div>
    )
}
