import React, { useState, useEffect, useRef } from "react";  // Tambahkan useState
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Notification from "./components/Notification";
import { useUser, useAuth } from '@clerk/clerk-react';
import Layout from "./pages/Layout";
import { Toaster, toast } from 'react-hot-toast';
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/user/userSlice.js";
import { fetchConnections } from "./features/connections/connectionsSlice.js";
import { addMessage } from "./features/messages/messagesSlice.js";

const App = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { pathname } = useLocation();
    const pathnameRef = useRef(pathname)
    const [currentToken, setCurrentToken] = useState(null);  // State untuk simpan token
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchData = async () => {
            if(user){
                console.log("🔑 User logged in:", user.id);  // Debug user
                dispatch(fetchUser())
                dispatch(fetchConnections())
            }
        }
        fetchData()
    }, [user, dispatch]);  // Trigger setiap kali user berubah (login/logout/signup)

    useEffect(()=>{
        pathnameRef.current = pathname
    },[pathname])

    useEffect(()=>{
        if(user){
            console.log('🔌 Client: Setting up SSE connection for user:', user.id);
            const eventSource = new EventSource(import.meta.env.VITE_BASEURL.replace(/\/$/, '') + '/api/messages/' + user.id);
            
            eventSource.onopen = () => {
                console.log('🔌 Client: SSE connection opened');
            };
            
            eventSource.onmessage = (event)=>{
                try {
                    console.log('📨 Client: Raw SSE data received:', event.data);
                    
                    // Skip "Connected" message, it's not JSON
                    if (event.data === 'Connected to SSE stream') {
                        console.log('✅ Client: SSE Connected for user:', user.id);
                        return;
                    }
                    
                    const message = JSON.parse(event.data)
                    console.log('📨 Client: Parsed SSE message:', message);
                    
                    // Check if we're on the chat page with this sender/receiver
                    const currentPath = pathnameRef.current;
                    console.log('🔍 Client: Current path:', currentPath);
                    
                    const chatPathPattern = /^\/messages\/(.+)$/;
                    const match = currentPath.match(chatPathPattern);
                    
                    if (match) {
                        const chatUserId = match[1];
                        console.log('🔍 Client: Chat user ID:', chatUserId);
                        
                        // Check if message involves the user we're chatting with
                        const fromUserId = message.from_user_id._id || message.from_user_id;
                        const toUserId = message.to_user_id._id || message.to_user_id;
                        
                        console.log('🔍 Client: Message from:', fromUserId, 'to:', toUserId);
                        console.log('🔍 Client: Checking if message matches chat:', fromUserId === chatUserId || toUserId === chatUserId);
                        
                        if (fromUserId === chatUserId || toUserId === chatUserId) {
                            console.log('✅ Client: Adding message to current chat');
                            dispatch(addMessage(message))
                        } else {
                            console.log('⏸️ Client: Message not for current chat, ignoring');
                        }
                    } else {
                        console.log('⏸️ Client: Not on chat page, showing notification');
                        // Show toast notification when not on chat page
                        toast.custom((t)=>(
                            <Notification t={t} message={message}/>
                        ))
                    }
                    
                    // Always refresh recent messages when a new message is received
                    if (window.refreshRecentMessages) {
                        console.log('📨 Client: Refreshing recent messages');
                        window.refreshRecentMessages();
                    }
                } catch (error) {
                    console.error('❌ Client: SSE parsing error:', error, 'Data:', event.data);
                }
            }
            
            eventSource.onerror = (error) => {
                console.error('❌ Client: SSE error:', error);
                console.log('❌ Client: SSE connection state:', eventSource.readyState);
                eventSource.close();
            }
            
            return ()=>{
                console.log('🔌 Client: Closing SSE connection');
                eventSource.close()
            }
        } else {
            console.log('🔌 Client: No user, skipping SSE setup');
        }
    },[user, dispatch])

    // Show loading screen while Clerk is loading
    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <>
            <Toaster 
                position="bottom-right"
                gutter={12}
                containerStyle={{
                    right: 20,
                    bottom: 20,
                }}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'white',
                        color: 'black',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        borderRadius: '0.5rem',
                        padding: '0',
                    }
                }}
            />
            <Routes>
                <Route path='/' element={!user ? <Login /> : <Layout />}>
                    <Route index element={<Feed />} />
                    <Route path='messages' element={<Messages />} />
                    <Route path='messages/:userId' element={<ChatBox />} />
                    <Route path='connections' element={<Connections />} />
                    <Route path='discover' element={<Discover />} />
                    <Route path='profile' element={<Profile />} />
                    <Route path='profile/:profileId' element={<Profile />} />
                    <Route path='create-post' element={<CreatePost />} />
                </Route>
            </Routes>
        </>
    );
};

export default App;

