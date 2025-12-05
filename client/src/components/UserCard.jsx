import React, { useState, useEffect } from 'react'
import { dummyUserData } from '../assets/assets'
import { MapPin, MessageCircle, Plus, UserPlus } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchConnections } from '../features/connections/connectionsSlice'
import { fetchUser } from '../features/user/userSlice'
import { useNavigate } from 'react-router-dom'

const UserCard = ({user}) => {
    const currentUser = useSelector((state)=> state.user.value)
    const {getToken} = useAuth()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [connectionStatus, setConnectionStatus] = useState('none') // 'none', 'pending', 'connected'

    // Check connection status when component mounts or user changes
    useEffect(() => {
        const checkConnectionStatus = async () => {
            try {
                const response = await api.post('/api/users/check-connection', { id: user._id })
                setConnectionStatus(response.data.status)
            } catch (error) {
                // If error, assume no connection
                setConnectionStatus('none')
            }
        }
        
        if (user._id && currentUser?._id) {
            checkConnectionStatus()
        }
    }, [user._id, currentUser._id])

    const handleFollow = async () => {
        try {
            const {data} = await api.post('/api/users/follow', {id: user._id})
            if(data.success){
                toast.success(data.message)
                dispatch(fetchUser(await getToken()))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const handleConnectionRequest = async () => {
        console.log('🔍 Client - Current user:', currentUser);
        console.log('🔍 Client - Target user:', user);
        console.log('🔍 Client - Target user _id:', user._id);
        console.log('🔍 Client - Is already connected:', currentUser?.connections?.includes(user._id));
        
        if(connectionStatus === 'connected'){
            return navigate('/messages/' + user._id)
        }

        if(connectionStatus === 'pending') {
            toast.error('Connection request already sent')
            return
        }

        try {
            console.log('🔍 Client - Sending connection request...');
            const {data} = await api.post('/api/users/connect', {id: user._id})
            console.log('🔍 Client - Response:', data);
            if(data.success){
                toast.success(data.message)
                // Update connection status to pending
                setConnectionStatus('pending')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('🔍 Client - Error:', error);
            console.error('🔍 Client - Error response data:', error.response?.data);
            console.error('🔍 Client - Error response status:', error.response?.status);
            console.error('🔍 Client - Error response text:', error.response?.statusText);
            toast.error(error.message)
        }
    }
  return (
    <div key={user._id} className='p-4 pt-6 flex flex-col justify-between w-75 shadow border border-gray-200 rounded-md'>
        <div className='text-center'>
            <img src={user.profile_picture} alt="" className='rounded-full w-16 shadow-md mx-auto'/>
            <p className='mt-4 font-semibold'>{user.full_name}</p>
            {user.username && <p className='text-gray-500 font-light'>@{user.username}</p>}
            {user.bio && <p className='text-gray-500 font-light whitespace-pre-line'>{user.bio}</p>}
        </div>

        <div className='flex items-center justify-center gap-2 mt-4 text-xs text-gray-600'>
          <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
            <MapPin className='w-4 h-4'/> {user.location}
          </div>
          <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
            <span>{user.followers.length}</span>
          </div>
        </div>

        <div className='flex mt-4 gap-2'>
          {/* tombol Follow */}
          <button onClick={handleFollow} disabled={currentUser?.following.includes (user._id)} className='w-full py-2 rounded-md flex justify-center items-center gap-2 bg-linear-to-r from-orange-700 to-red-600 hover:from-orange-600 hover:to-red-700 active:sclae-95 transition text-white cursor-pointer'>
            <UserPlus className='w-4 h-4'/> {currentUser?.following.includes(user._id) ? 'Following' : 'Follow'}
          </button>
          {/* Connection req / message button */}
          <button 
            onClick={handleConnectionRequest} 
            disabled={connectionStatus === 'pending'}
            className={`flex items-center justify-center w-16 border rounded-md cursor-pointer active:scale-95 transition ${
              connectionStatus === 'pending' 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'text-slate-500 group hover:border-blue-400'
            }`}
          >
            {
              connectionStatus === 'connected' ? 
              <MessageCircle className='w-5 h-5 group-hover:scale-105 transition'/>
              :
              connectionStatus === 'pending' ?
              <span className='text-xs font-medium'>Pending</span>
              :
              <Plus className='w-5 h-5 group-hover:scale-105 transition'/>
            }
          </button>
        </div>

    </div>
  )
}

export default UserCard
