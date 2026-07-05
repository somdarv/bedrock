import { useRouter } from 'next/navigation';
import React from 'react'


export default function ButtonPrimary({ buttonType, label, path, setContactType, cType }) {
    const router = useRouter()

    const clickFunction = () => {
        if (path) {
            router.push(path);
        }
        if (setContactType) {
            setContactType(cType);
        }
    }



    return (
        <div className=''>

            <button type={buttonType} onClick={clickFunction} className='w-aut bg-white px-4 py-2 flex items-center group  text-primary my-8 text-sm font-semibold'>

                <span className='transition-all mr-1 duration-300 ease-in-out group-hover:mr-2'>
                    {label}
                </span>

                <span className="text-xl  mb-1">
                    &rarr;
                </span>
            </button>
        </div>
    )
}
