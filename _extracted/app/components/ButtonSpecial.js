import { useRouter } from 'next/navigation';
import React from 'react'
import { IoLogoWhatsapp } from "react-icons/io";


export default function ButtonSpecial({ label, path, setContactType, cType }) {
    const router = useRouter;

    const clickFunction = () => {
        // router.push(path);
        setContactType(cType);
        window.open(path, '_blank')
        setContactType(cType);


    }
    return (
        <div className=''>

            <button onClick={clickFunction} className='flex items-center px-4 py-3 my-8 text-sm font-semibold text-white bg-transparent border w-aut border-secondary gap-x-2 group'>
                <span>
                    <IoLogoWhatsapp className='text-xl' />
                </span>

                <span className='ml-1 transition-all duration-300 ease-in-out group-hover:ml-2'>
                    {label}
                </span>

                {/* <span className="mb-1 text-xl">
                    &rarr;
                </span> */}
            </button>
        </div>
    )
}
