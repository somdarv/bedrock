'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';



export default function NavAdmin({ page }) {

    const router = useRouter();

    const menuItems = [
        { id: 1, label: 'Accounts', path: '/accounts' },
        // { id: 2, label: 'Expertise', path: '/expertise' },
        // // { id: 3, label: 'Services', path: '/services' },
        // { id: 4, label: 'Contact', path: '/contact' },
        // { id: 5, label: 'Enterprise', path: '/enterprise'},
    ]

    const [activeItem, setActiveItem] = useState(page);


    const handleNavigation = (item) => {
        setActiveItem(item.label);
        router.push(item.path);
    };


    const navVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };


    return (
        <motion.div
            className='flex items-center w-[80%] py-8 mx-auto'
            initial="hidden"
            animate="visible"
            variants={navVariants}
        >
            <div className='w-[15%] flex-start'>
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

        </motion.div>
    )
}
