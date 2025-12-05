import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import { dummyPostsData, dummyUserData } from '../assets/assets'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard'
import moment from 'moment'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import api from '../api/axios'

const Profile = () => {

  const currentUser = useSelector((state)=> state.user.value)
  console.log(currentUser)
  const { getToken } = useAuth()
  const {profileId} = useParams()
  const[user, setUser] = useState(null)
  const[posts, setPosts] = useState([])
  const[activeTab, setActiveTab] = useState('posts')
  const[showEdit, setShowEdit] = useState(false)

  const fetchUser = async (profileId) => {
    console.log('🔍 Fetching user data for:', profileId)
    const token = await getToken()
    console.log('🔑 Token:', token ? 'GOT TOKEN' : 'NO TOKEN')
    try {
      const { data } = await api.post(`/api/users/profiles`, {profileId}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      console.log('📡 API Response:', data)
      if (data.success) {
        console.log('✅ User data loaded:', data.profile)
        setUser(data.profile)
        setPosts(data.posts)
      } else {
        console.log('❌ API Error:', data.message)
        toast.error(data.message)
      }
    } catch (error) {
      console.log('💥 API Error:', error)
      toast.error(error.message)
    }
  }

  useEffect(()=> {
    console.log('🎯 useEffect triggered')
    console.log('📍 ProfileId:', profileId)
    console.log('👤 CurrentUser:', currentUser)
    if(profileId){
      console.log('🔄 Fetching specific user:', profileId)
      fetchUser(profileId)
    } else {
      console.log('🔄 Fetching current user:', currentUser?._id)
      if(currentUser?._id){
        fetchUser(currentUser._id)
      } else {
        console.log('⚠️ No current user ID available')
      }
    }
  },[profileId, currentUser])

  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>
        {/* Profile card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>
          {/* Foto Cover */}
          <div className='h-40 md:h-56 bg-linear-to-r from-orange-200 via-red-200 to-yellow-200'>
            {user.cover_photo && <img src={user.cover_photo} alt='' className='w-full h-full object-cover'/>}
          </div>
          {/* User info */}
          <UserProfileInfo user={user} posts={posts} profileId={profileId} setShowEdit={setShowEdit}/>
        </div>

        {/* Tabs */}
        <div className='mt-6'>
          <div className='bg-white rounded-xl shadow p-1 flex max-w-md mx-auto'>
            {["posts", "media", "likes"].map((tab)=>(
              <button onClick={()=>setActiveTab(tab)} key={tab} className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === tab ? "bg-orange-600 text-white" : "text-gray-600 hover:text-gray-900"}`}>
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {/* Posts */}
          {activeTab === 'posts' && (
            <div className='mt-6 flex flex-col items-center gap-6'>
              {posts.map((post)=> <PostCard key={post._id} post={post}/>)}
            </div>
          )}

          {/* Media */}
          {activeTab === 'media' && (
            <div className='flex flex-wrap mt-6 max-w-6xl'>
              {
                posts.filter((post)=> post.image_urls.length > 0).map((post)=>(
                  <>
                  {post.image_urls.map((image, index)=>(
                    <Link target='_blank' to={image} key={index} className='relative group'>
                      <img src={image} key={index} className='w-full max-w-64 object-cover' alt="" />
                      <p className='absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300'>Posted {moment(post.createdAt).fromNow()}</p>
                    </Link>
                  ))}
                  </>
                ))
              }
            </div>
          )}

        </div>
      </div>
      {/* Edit profil */}
      {showEdit && <ProfileModal setShowEdit={setShowEdit}/>}
    </div>
  ) : (<Loading/>)
}

export default Profile
