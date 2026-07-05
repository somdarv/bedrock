'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion';


import Navigation from '../components/Navigation'
import ButtonPrimary from '../components/ButtonPrimary';
import ButtonSpecial from '../components/ButtonSpecial';
import Footer from '../components/Footer';
import ButtonNav from './ButtonNav';
import axios from 'axios';



export default function CallBack({ contactType, setContactType }) {
    const heroVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const validatePhone = (phone) => {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return phoneRegex.test(phone);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim() || !formData.phone.trim()) {
            setError('Both name and phone number are required.');
            return;
        }

        if (!validatePhone(formData.phone)) {
            setError('Please enter a valid phone number.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/callback', formData);

            if (response.status === 200) {
                setSuccess(true);
                setFormData({ name: '', phone: '' });
                setTimeout(() => {
                    setContactType(0);
                }, 2000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                'There was an error submitting the form. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className='text-white w-[80%]  mx-auto container-section-start'>

            <motion.div initial="hidden"
                animate="visible"
                variants={heroVariants} className='w-[12%] '><p className='text-6xl '> <ButtonNav cType={0} setContactType={setContactType} label={'Back'} /> </p>
            </motion.div>


            <motion.div initial="hidden"
                animate="visible"
                variants={heroVariants} className='my-  border-secondary/50 w-[84%] '>

                <motion.h1 initial="hidden"
                    animate="visible"
                    variants={heroVariants} className='font-bold text-3xl my-'>Request A Call Back
                </motion.h1>


                <motion.h1 initial="hidden"
                    animate="visible"
                    variants={heroVariants} className='font-bol text-lg w-[60%] my-8'>

                    <p className='capitalize my-2'>Tell us how to contact you.</p>

                    <div className='my-8'>

                        <form onSubmit={handleSubmit} className='w-[90%] flex items-center gap-x-4'>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange} className={`text-sm placeholder-gray-200 font-semibold  py-4 bg-transparent outline-none border-b border-secondary px-2 focus:border-b-2 `}
                                placeholder='Name' disabled={loading}

                            />
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange} className={`text-sm placeholder-gray-200 font-semibold  py-4 bg-transparent outline-none border-b border-secondary px-2 focus:border-b-2 `}
                                placeholder='Phone Number' disabled={loading}

                            />


                            <div className='flex justify-end '>
                                <ButtonPrimary type="submit"
                                    label={'Submit'}
                                    disabled={loading}
                                    className={`px-6 py-2 bg-secondary text-white rounded-md 
                                          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/80'}`} />
                            </div>

                        </form>
                        {/* Display loading or error message */}
                        {loading ? <p className='text-sm'>Requesting...</p> : ''}
                        {error && <p className='text-red-500 text-sm'>{error}</p>}
                        {success && <p className='text-green-500 text-sm'>Request Made successfully!</p>}


                    </div>

                </motion.h1>




            </motion.div>





        </div>

    )
}
