import React from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Notification = ({t, message}) => {

const navigate = useNavigate()

    return (
        <div className={`max-w-md w-full bg-white shadow-lg rounded-lg flex border border-gray-300 hover:scale-105 transition p-4 items-center`}>
            <div className='flex items-center flex-grow'>
                <img src={message.from_user_id.profile_picture} alt="" className='h-8 w-8 rounded-full flex-shrink-0'/>
                <div className='ml-3'>
                   <p className="text-sm font-semibold text-gray-900">
                        {message.from_user_id.full_name} </p>
                   <p className="text-sm text-gray-600">
                        {message.text.slice(0, 50)} </p>
                </div>
            </div>
            <button onClick={()=>{
                navigate(`/messages/${message.from_user_id._id}`);
                toast.dismiss(t.id)
            }} className='text-indigo-600 font-semibold py-2 px-4 rounded-md hover:bg-indigo-50 transition-colors duration-200'>
                Reply
            </button>
        </div>
    )
}

export default Notification