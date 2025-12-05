import React, { useEffect, useState } from 'react'
import { dummyRecentMessagesData } from '../assets/assets'
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useUser } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Global variable to store refresh function
let refreshRecentMessages = null;

const RecentMessages = () => {

    const [messages, setMessages] = useState ([])
    const {user} = useUser()

    const fetchRecentMessages = async () => {
        try {
            console.log('📨 RecentMessages: Starting API call to /api/messages/recent');
            console.log('📨 RecentMessages: API base URL:', import.meta.env.VITE_BASEURL);
            
            // Direct API call without test endpoint (uses global timeout)
            const response = await api.get('/api/messages/recent')
            console.log('📨 RecentMessages: API response received:', response);
            const data = response.data;
            console.log('📨 Recent messages API response:', data)
            if (data.success){
                console.log('📨 Raw messages from server:', data.messages)
                const groupedMessages = data.messages.reduce((acc, message)=>{
                    // Get the other person's ID (not the current user)
                    const otherUserId = message.from_user_id._id === user?.id 
                        ? message.to_user_id._id 
                        : message.from_user_id._id;
                    
                    // Get the other person's data
                    const otherUserData = message.from_user_id._id === user?.id 
                        ? message.to_user_id 
                        : message.from_user_id;
                    
                    if (!acc[otherUserId] || new Date(message.createdAt) > new Date(acc[otherUserId].createdAt)){
                        acc[otherUserId] = {
                            ...message,
                            other_user: otherUserData
                        }
                    }
                    return acc;
                }, {})
                console.log('📨 Grouped messages:', groupedMessages)
                //  sort message by date
                const sortedMessages = Object.values(groupedMessages).sort((a, b)=>new Date(b.createdAt) - new Date(a.createdAt))
                console.log('📨 Final sorted messages:', sortedMessages)

                setMessages(sortedMessages)
            } else {
                console.error('❌ RecentMessages: API returned success=false:', data.message);
                toast.error(data.message)
            }
        } catch (error) {
            console.error('❌ RecentMessages: Error fetching recent messages:', error)
            console.error('❌ RecentMessages: Error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config?.url
            });
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        if (user) {
            fetchRecentMessages()
            // Reduce polling frequency to every 30 seconds instead of 3 seconds
            const intervalId = setInterval(fetchRecentMessages, 30000)
            refreshRecentMessages = fetchRecentMessages; // Store refresh function globally
            return () => {
                clearInterval(intervalId)
                refreshRecentMessages = null; // Clean up
            }
        }
    }, [user])

    // Export refresh function for external use
    useEffect(() => {
        console.log('📨 RecentMessages: Setting up window.refreshRecentMessages');
        window.refreshRecentMessages = () => {
            console.log('📨 RecentMessages: refreshRecentMessages called!');
            fetchRecentMessages();
        };
        return () => {
            console.log('📨 RecentMessages: Cleaning up window.refreshRecentMessages');
            delete window.refreshRecentMessages;
        }
    }, [user])

  return (
    <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md text-xs text-slate-800'>
        <h3 className='font-semibold text-slate-800 mb-4'>Recent Messages</h3>
        <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
            {
                messages.map((message, index)=>(
                    <Link to={`/messages/${message.other_user._id}`} key={index} className='flex items-start gap-2 py-2 hover:bg-slate-100'>
                        <img src={message.other_user.profile_picture} alt="" className='w-8 h-8 rounded-full'/>
                        <div className='w-full'>
                            <div className='flex justify-between'>
                                <p className='font-medium'>{message.other_user.full_name}</p>
                                <p className='text-[10px] text-slate-400'>{moment(message.createdAt).fromNow()}</p>
                            </div>
                            <div className='flex justify-between'>
                                <p>{message.text ? message.text : 'Media'}</p>
                                {!message.seen && <p className='bg-orange-500 text-white  w-4 h-4 flex items-center justify-center rounded-full text-[10px]'>1</p>}
                            </div>
                        </div>
                    </Link>
                ))
            }

        </div>
    </div>
  )
}

export default RecentMessages
