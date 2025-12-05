import { ArrowLeft, Sparkle, TextIcon, Upload } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'

const StoryModal = ({setShowModal, fetchStories}) => {
    
    const bgColors = ["#4f46e5", "#7c3aed", "#db2777", "#e11d48", "#ca8a04", "#0d9488"]

    const [mode, setMode] = useState("text")
    const [background, setBackground] = useState(bgColors[0])
    const [text, setText] = useState("")
    const [media, setMedia] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const {getToken} = useAuth()

    const MAX_VIDEO_DURATION = 60; // seconds
    const MAX_VIDEO_SIZE_MB = 50; // MB

    const handleMediaUpload = (e)=> {
        const file = e.target.files?.[0]
        if(file){
            if(file.type.startsWith("video")){
                if(file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024){
                    toast.error(`Video file size cannot exceed ${MAX_VIDEO_SIZE_MB} MB.`)
                    setMedia(null)
                    setPreviewUrl(null)
                    return;
                }
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src)
                    if(video.duration > MAX_VIDEO_DURATION){
                        toast.error("Video duration cannot exceed 1 minute.")
                        setMedia(null)
                        setPreviewUrl(null)
                    } else {
                        setMedia(file)
                        setPreviewUrl(URL.createObjectURL(file))
                        setText('')
                        setMode('media')
                    }
                }

                video.src = URL.createObjectURL(file)
            } else if(file.type.startsWith("image")){
                setMedia(file)
                setPreviewUrl(URL.createObjectURL(file))
                setText('')
                setMode('media')
            }
        }
    }

    const handleCreateStory = async () => {
        console.log('📖 [StoryModal] Creating story...');
        console.log('📖 [StoryModal] Mode:', mode);
        console.log('📖 [StoryModal] Text:', text);
        console.log('📖 [StoryModal] Media:', media);
        console.log('📖 [StoryModal] Background:', background);
        
        const media_type = mode === 'media' ? media?.type.startsWith('image') ? 'image' : "video" : "text";

        if(media_type === "text" && !text){
            toast.error("Please enter some text")
            return
        }

        let formData = new FormData();
        formData.append('content', text);
        formData.append('media_type', media_type);
        formData.append('media', media);
        formData.append('background_color', background);

        console.log('📖 [StoryModal] FormData prepared:', {
            content: text,
            media_type,
            background_color: background,
            media: !!media
        });

        const token = await getToken();
        console.log('📖 [StoryModal] Got token:', !!token);
        console.log('📖 [StoryModal] Token length:', token?.length);
        console.log('📖 [StoryModal] Token preview:', token?.substring(0, 50) + '...');
        
        try {
            console.log('📖 [StoryModal] Making API call to:', api.defaults.baseURL.replace(/\/$/, '') + '/api/stories/create');
            console.log('📖 [StoryModal] FormData being sent:', formData);
            
            // Add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const token2 = token || (window?.Clerk ? await window.Clerk.session.getToken() : undefined);
            const { data } = await api.post('/api/stories/create', formData, {
                signal: controller.signal,
                headers: token2 ? { Authorization: `Bearer ${token2}` } : undefined
            });
            
            clearTimeout(timeoutId);
            console.log('📖 [StoryModal] API response:', data);
            
            if(data.success){
                console.log('📖 [StoryModal] Story created successfully');
                setShowModal(false)
                toast.success("Story created successfully")
                fetchStories()
            } else {
                console.error('📖 [StoryModal] API returned error:', data.message);
                toast.error(data.message)
            }
        } catch (error) {
            console.error('📖 [StoryModal] Error creating story:', error);
            console.error('📖 [StoryModal] Error response:', error.response?.data);
            console.error('📖 [StoryModal] Error status:', error.response?.status);
            console.error('📖 [StoryModal] Error code:', error.code);
            
            if (error.name === 'AbortError') {
                toast.error("Request timeout - server not responding");
            } else {
                toast.error(error.message || "Failed to create story");
            }
        }
    }

  return (
    <div className='fixed inset-0 z-110 min-h-screen bg-black/80 backdrop-blur text-white flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-4 flex items-center justify-between'>
            <button onClick={()=> setShowModal(false)} className='text-white p-2 cursor-pointer'>
                <ArrowLeft />
            </button>
            <h2 className='text-lg font-semibold'>Create Story</h2>
            <span className='w-10'></span>
        </div>

        <div className='rounded-lg h-96 flex items-center justify-center relative' style={{backgroundColor: background}}>

            {mode === 'text' && (
                <textarea className='bg-transparent text-white w-full h-full p-6 text-lg resize-none focus:outline-none' placeholder="What is up?" onChange={(e)=>setText(e.target.value)} value={text}/>
            )}
            {
                mode === 'media' && previewUrl && (
                    media?.type.startsWith('image') ? (
                        <img src={previewUrl} alt="" className='object-contain max-h-full'/>
                    ) : (
                        <video src={previewUrl} className='object-contain max-h-full'/>
                    )
                )
            }

        </div>

            <div className='flex mt-4 gap-2'>
                {bgColors.map((color)=>(
                    <button key={color} className='w-6 h-6 rounded-full ring cursor-pointer' style={{backgroundColor: color}} onClick={()=> setBackground(color)}/>
                ))}
            </div>

            <div className='flex gap-2 mt-4'>
                <button onClick={()=> {setMode('text'); setMedia(null); setPreviewUrl(null)}} className={`flex-1 flex items-center justify-center cursor-pointer gap-2 p-2 rounded ${mode === 'text' ? "bg-white text-black" : "bg-zinc-800"}`}>
                    <TextIcon size={18}/> Text
                </button>
                <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer ${mode === 'media' ? "bg-white text-black" : "bg-zinc-800"}`}>
                    <input onChange={handleMediaUpload} type="file" accept='image/*, video/*' className='hidden'/>
                    <Upload size={18}/> Foto/Video
                </label>
            </div>
            <button onClick={handleCreateStory} className='flex items-center justify-center gap-2 text-white py-3 mt-4 w-full rounded bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 transition cursor-pointer'>
                <Sparkle size={18}/> Create Story
            </button>

      </div>
    </div>
  )
}

export default StoryModal
