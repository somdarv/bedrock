import { useRouter } from 'next/navigation'
import React from 'react'

export default function ButtonNav({ label, path, setContactType, cType }) {
    const router = useRouter();


    const clickFunction = () => {
        // router.push(path);
        setContactType(cType);
    }

    return (
        <div className=''>

            <button onClick={clickFunction} className='w-aut  px-4 py-2 flex items-center group  text-secondary my-8 text-sm font-semibold'>
                <span className="text-xl  mb-1">
                    &larr;
                </span>

                <span className='transition-all ml-1 duration-300 ease-in-out group-hover:ml-2'>
                    {label}
                </span>
            </button>
        </div>
    )
}
