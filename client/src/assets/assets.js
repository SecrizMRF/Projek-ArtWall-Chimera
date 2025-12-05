import logo from './artwall_logo.svg'
import sample_cover from './sample_cover.jpg'
import sample_profile from './fadhil acara.jpg'
import sample_profile2 from './edric acara.jpg'
import sample_profile3 from './yasmin acara.jpg'
import bgImage from './bgImage.png'
import group_users from './group_users.png'
import { Home, MessageCircle, Search, UserIcon, Users } from 'lucide-react'
import sponsored_img from './sponsored_img.png'

export const assets = {
    logo,
    sample_cover,
    sample_profile,
    bgImage,
    group_users,
    sponsored_img
}

export const menuItemsData = [
    { to: '/', label: 'Feed', Icon: Home },
    { to: '/messages', label: 'Messages', Icon: MessageCircle },
    { to: '/connections', label: 'Connections', Icon: Users },
    { to: '/discover', label: 'Discover', Icon: Search },
    { to: '/profile', label: 'Profile', Icon: UserIcon },
];

export const dummyUserData = {
    "_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "email": "admin@example.com",
    "full_name": "Fufu Fafa",
    "username": "fufufafa_",
    "bio": "🌍 Dreamer | 📚 Learner | 🚀 Doer \r\nExploring life one step at a time.\r\n✨ Staying curious. Creating with purpose.",
    "profile_picture": sample_profile,
    "cover_photo": sample_cover,
    "location": "Indonesia, ID",
    "followers": ["user_2", "user_3"],
    "following": ["user_2", "user_3"],
    "connections": ["user_2", "user_3"],
    "posts": [],
    "is_verified": true,
    "createdAt": "2025-11-09T09:26:59.231Z",
    "updatedAt": "2025-11-11T06:56:50.017Z",
}

const dummyUser2Data = {
    ...dummyUserData,
    _id: "user_2",
    username: "Edric Roland Li",
    full_name: "Edric Roland Li",
    profile_picture: sample_profile2,
}

const dummyUser3Data = {
    ...dummyUserData,
    _id: "user_3",
    username: "Mimin Assyifa",
    full_name: "Yasmin Assyifa",
    profile_picture: sample_profile3,
}

export const dummyStoriesData = [
    {
        "_id": "68833d466e4b42b685068860",
        "user": dummyUserData,
        "content": "📌 This isn't the story I wanted to tell… not yet. But if you're reading this, know that something interesting is in motion 🔄. The next post will make more sense 🧩.",
        "media_url": "",
        "media_type": "text",
        "background_color": "#4f46e5",
        "createdAt": "2025-11-13T08:16:06.958Z",
        "updatedAt": "2025-11-13T08:16:06.958Z",
    },
    {
        "_id": "688340046e4b42b685068a73",
        "user": dummyUserData,
        "content": "",
        "media_url": "https://i.pinimg.com/736x/5c/88/e5/5c88e55c8ad8350601cc96a706cb02fa.jpg",
        "media_type": "image",
        "background_color": "#4f46e5",
        "createdAt": "2025-11-13T08:27:48.134Z",
        "updatedAt": "2025-11-13T08:27:48.134Z",
    },
    {
        "_id": "68833fe96e4b42b685068a5e",
        "user": dummyUserData,
        "content": "",
        "media_url": "https://videos.pexels.com/video-files/14447442/14447442-hd_1080_1920_30fps.mp4",
        "media_type": "video",
        "background_color": "#4f46e5",
        "createdAt": "2025-11-13T08:27:21.289Z",
        "updatedAt": "2025-11-13T08:27:21.289Z",
    },
    {
        "_id": "68833e136e4b42b685068937",
        "user": dummyUserData,
        "content": "",
        "media_url": "https://i.pinimg.com/736x/1c/29/92/1c2992d8d0f990db81d6bcb4749d9d11.jpg",
        "media_type": "image",
        "background_color": "#4f46e5",
        "createdAt": "2025-11-13T08:19:31.080Z",
        "updatedAt": "2025-11-13T08:19:31.080Z",
    },
    {
        "_id": "68833d706e4b42b685068875",
        "user": dummyUserData,
        "content": "🤫 Not every moment needs to be loud. Sometimes, the best things happen in silence — in drafts 📝, in progress 🧪, in planning 📊. That's where I am right now.",
        "media_url": "",
        "media_type": "text",
        "background_color": "#4f46e5",
        "createdAt": "2025-11-13T08:16:48.617Z",
        "updatedAt": "2025-11-13T08:16:48.617Z",
    },
    {
        "_id": "68833c9e6e4b42b6850687e7",
        "user": dummyUserData,
        "content": "✨ Something meaningful is on the way. I'm working behind the scenes 🛠️ to bring it all together. This space is just the beginning 🌱. Stay tuned 👀.",
        "media_url": "",
        "media_type": "text",
        "background_color": "#4f46e5",
        "createdAt": "2025-11-12T08:13:18.111Z",
        "updatedAt": "2025-11-12T08:13:18.111Z",
    }
]


export const dummyPostsData = [
    {
        "_id": "68773e977db16954a783839c",
        "user": dummyUserData,
        "content": "Teamwork always mean that a person will #work and the others just being together. #sybau",
        "image_urls": [
            "https://i.pinimg.com/736x/e2/eb/fb/e2ebfb79c21cf0ca9ca64d94950cc7d2.jpg"
        ],
        "post_type": "text_with_image",
        "likes_count": [],
        "createdAt": "2025-11-12T05:54:31.191Z",
        "updatedAt": "2025-11-12T05:54:31.191Z",
    },
    {
        "_id": "686e6d0407845749500c24cd",
        "user": dummyUserData,
        "content": "Tetaplah bernafas kawan, ingatlah Projek Pemweb, Basdat, Pemweb lagi, Pemweb yang satu nya lagi, Strukdat, dan Wirdig masih menagih hoetank mu kawan.\r\n\r\n#Motivation #GrowthMindset #DailyInspiration #StayFocused #LevelUp #PositiveVibes #KeepGoing #SelfImprovement #MindsetMatters #SuccessJourney",
        "image_urls": [],
        "post_type": "text",
        "likes_count": [],
        "createdAt": "2025-11-11T13:22:12.601Z",
        "updatedAt": "2025-11-11T13:22:12.601Z",
    },
    {
        "_id": "686e6b21de877d29cf02e2a7",
        "user": dummyUserData,
        "content": "Testing pake #hashtag",
        "image_urls": [],
        "post_type": "text",
        "likes_count": [],
        "createdAt": "2025-11-11T13:14:09.144Z",
        "updatedAt": "2025-11-11T13:14:09.144Z",
    },
    {
        "_id": "686e3e47ba0cf0fecba19947",
        "user": dummyUserData,
        "content": "",
        "image_urls": [
            "https://i.pinimg.com/736x/5c/88/e5/5c88e55c8ad8350601cc96a706cb02fa.jpg"
        ],
        "post_type": "image",
        "likes_count": [
            "user_2zdJbcAqiOX9jq2DIueBRQn0lMt"
        ],
        "createdAt": "2025-11-11T10:02:47.213Z",
        "updatedAt": "2025-11-11T10:09:37.075Z",
    },
    {
        "_id": "686e39e86e0585e9e2e58dd3",
        "user": dummyUserData,
        "content": "Aku saya adalah i am",
        "image_urls": [
            "https://i.pinimg.com/736x/1c/29/92/1c2992d8d0f990db81d6bcb4749d9d11.jpg"
        ],
        "post_type": "text_with_image",
        "likes_count": [],
        "createdAt": "2025-11-11T09:44:08.626Z",
        "updatedAt": "2025-11-11T09:44:08.626Z",
    },
    {
        "_id": "686e361389841ba9f2633201",
        "user": dummyUserData,
        "content": "Bersiaplah!",
        "image_urls": [],
        "post_type": "text",
        "likes_count": [],
        "createdAt": "2025-11-12T09:27:47.529Z",
        "updatedAt": "2025-11-12T09:27:47.529Z",
    }
]

export const dummyRecentMessagesData = [
    {
        "_id": "68833af618623d2de81b5381",
        "from_user_id": dummyUser2Data,
        "to_user_id": dummyUserData,
        "text": "Kok dia lucu kali ya dil?",
        "message_type": "text",
        "media_url": "",
        "seen": true,
        "createdAt": "2025-11-13T08:06:14.436Z",
        "updatedAt": "2025-11-13T08:47:47.768Z",
    },
    {
        "_id": "6878cc3c17a54e4d3748012f",
        "from_user_id": dummyUserData,
        "to_user_id": dummyUserData,
        "text": "Infokan pengerjaan Pemweb kawan",
        "message_type": "text",
        "media_url": "",
        "createdAt": "2025-11-09T10:11:08.437Z",
        "updatedAt": "2025-11-09T08:07:11.893Z",
        "seen": true
    },
    {
        "_id": "686fb66c7f0dcbff63b239e7",
        "from_user_id": dummyUser3Data,
        "to_user_id": dummyUserData,
        "text": "Hai fadhill!",
        "message_type": "text",
        "media_url": "",
        "createdAt": "2025-11-11T12:47:40.510Z",
        "updatedAt": "2025-11-11T12:47:40.510Z",
        "seen": false
    }
]

export const dummyMessagesData = [
    {
        "_id": "6878cc3217a54e4d37480122",
        "from_user_id": "user_2zwZSCMRXQ9GaEEVLgm6akQo96i",
        "to_user_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
        "text": "",
        "message_type": "image",
        "media_url": "https://images.pexels.com/photos/106341/pexels-photo-106341.jpeg",
        "createdAt": "2025-07-17T10:10:58.524Z",
        "updatedAt": "2025-07-25T10:43:50.346Z",
        "seen": true
    },
    {
        "_id": "6878cc3c17a54e4d3748012f",
        "from_user_id": "user_2zwZSCMRXQ9GaEEVLgm6akQo96i",
        "to_user_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
        "text": "This is a Samsung Tablet",
        "message_type": "text",
        "media_url": "",
        "createdAt": "2025-07-17T10:11:08.437Z",
        "updatedAt": "2025-07-25T10:43:50.346Z",
        "seen": true
    },
    {
        "_id": "68835ffc6e4b42b685069def",
        "from_user_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
        "to_user_id": "user_2zwZSCMRXQ9GaEEVLgm6akQo96i",
        "text": "yah , this tablet is good",
        "message_type": "text",
        "media_url": "",
        "seen": false,
        "createdAt": "2025-07-25T10:44:12.753Z",
        "updatedAt": "2025-07-25T10:44:12.753Z",
    },
        {
        "_id": "6878cc2817a54e4d3748010c",
        "from_user_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
        "to_user_id": "user_2zwZSCMRXQ9GaEEVLgm6akQo96i",
        "text": "you can purchase it from amazon",
        "message_type": "text",
        "media_url": "",
        "createdAt": "2025-08-17T10:10:48.956Z",
        "updatedAt": "2025-08-25T10:43:50.346Z",
        "seen": true
    },
]

export const dummyConnectionsData = [
    dummyUserData,
    dummyUser2Data,
    dummyUser3Data
]

export const dummyFollowersData = [
    dummyUser2Data,
    dummyUser3Data
]

export const dummyFollowingData = [
    dummyUser2Data,
    dummyUser3Data
]

export const dummyPendingConnectionsData = [
    dummyUserData
]