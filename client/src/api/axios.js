import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASEURL,
    withCredentials: true, // Enable cookies for auth
    timeout: 30000 // Increase timeout to 30 seconds
});

// Add Clerk JWT token to all requests
api.interceptors.request.use(async (config) => {
    try {
        // Get Clerk session token from window
        if (window.Clerk) {
            const token = await window.Clerk.session.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('🔐 Added Clerk JWT token to request');
            }
        }
    } catch (error) {
        console.log('🔐 Could not get Clerk token:', error);
    }
    
    return config;
});

export default api;