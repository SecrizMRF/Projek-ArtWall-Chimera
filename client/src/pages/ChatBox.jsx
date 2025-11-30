import React, { useEffect, useRef, useState } from 'react'
import { dummyMessagesData, dummyUserData } from '../assets/assets'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { useDispatch } from 'react-redux'
import { addMessage, fetchMessages, resetMessages } from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'

const ChatBox = () => {

  const messages = useSelector((state)=> state.messages.messages || [])
  const { userId } = useParams()
  const dispatch = useDispatch()
  const { userId: currentUserId } = useAuth() // Get current logged-in user ID

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const messagesEndRef = useRef(null)

  const connections = useSelector((state)=> state.connections.connections || [])

  const fetchUserMessages = async () => {
    try {
      console.log('📨 ChatBox: Fetching messages for user:', userId);
      dispatch(fetchMessages(userId))
    } catch (error) {
      console.error('❌ ChatBox: Error fetching messages:', error);
      toast.error(error.message)
    }
  }

  const sendMessage = async () => {
    try {
      if(!text && !image) return

      console.log('📤 ChatBox: Sending message to:', userId);
      console.log('📤 ChatBox: Message text:', text);

      const formData = new FormData();
      formData.append('to_user_id', userId)
      formData.append('text', text)
      image && formData.append('image', image)

      const { data } = await api.post('/api/messages/send', formData)
      console.log('📤 ChatBox: API response:', data);
      
      if(data.success){
        setText('')
        setImage(null)
        // Don't add message manually - let SSE handle real-time updates
        console.log('📤 ChatBox: Message sent successfully, waiting for SSE update');
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('❌ ChatBox: Send message error:', error);
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    fetchUserMessages()

    return ()=>{
      dispatch(resetMessages())
    }
  },[userId])

  useEffect(()=>{
    if(connections.length > 0){
      const user = connections.find(connection => connection._id === userId)
      setUser(user)
    }
  },[connections, userId])

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
  }, [messages])

  return user && (
    <div className='flex flex-col h-screen'>
      <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-linear-to-r from-orange-50 to-red-50 border-b border-gray-300'>
        <img src={user.profile_picture} alt="" className='size-8 rounded-full'/>
        <div>
          <p className='font-medium'>{user.full_name}</p>
          <p className='text-sm text-gray-500 -mt-1.5'>@{user.username}</p>
        </div>
      </div>
      <div className='p-5 md:px-10 h-full overflow-y-scroll'>
        <div className='space-y-4 max-w-4xl mx-auto'>
          {
            [...messages].sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt)).map((message, index)=> {
              // Debug logging
              console.log('🔍 ChatBox: Message debug:', {
                text: message.text,
                from_user_id: message.from_user_id,
                to_user_id: message.to_user_id,
                from_user_id_string: typeof message.from_user_id === 'object' ? message.from_user_id._id : message.from_user_id,
                to_user_id_string: typeof message.to_user_id === 'object' ? message.to_user_id._id : message.to_user_id,
                currentUserId: currentUserId,
                chatUserId: userId,
                user_id: user?._id
              });

              // Determine if message is from current user
              const fromUserId = typeof message.from_user_id === 'object' ? message.from_user_id._id : message.from_user_id;
              const isFromCurrentUser = fromUserId === currentUserId;
              console.log('🔍 ChatBox: isFromCurrentUser:', isFromCurrentUser, 'fromUserId:', fromUserId, 'currentUserId:', currentUserId);

              return (
               <div key={index} className={`flex flex-col ${isFromCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${isFromCurrentUser ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                {
                message.message_type === 'image' && <img src={message.media_url} className='w-full max-w-sm rounded-lg mb-1' alt="" />
                }
                <p>{message.text}</p>
              </div>
             </div> 
              )
            })
          }
          <div ref={messagesEndRef}/>
        </div>
      </div>
      <div className='px-4'>
        <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5'>
            <input type="text" className='flex-1 outline-none text-slate-700' placeholder='Ketik pesan...'
            onKeyDown={e=>e.key === 'Enter' && sendMessage()} onChange={(e)=> setText(e.target.value)} value={text} />

            <label htmlFor="image">
              {
                image 
                ? <img src={URL.createObjectURL(image)} alt="" className='h-8 rounded'/>
                : <ImageIcon className='size-7 text-gray-400 cursor-pointer'/>
              }
              <input type="file" id='image' accept='image/*' hidden onChange={(e)=>setImage(e.target.files[0])}/>
            </label>

            <button onClick={sendMessage} className='bg-linear-to-br from-orange-500 to-red-600 hover:from-orange-700 hover:to-red-800 active:scale-95 cursor-pointer text-white p-2 rounded-full'>
              <SendHorizonal size={18}/>
            </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
