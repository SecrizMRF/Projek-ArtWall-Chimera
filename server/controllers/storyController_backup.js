import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

// Add user story
export const addUserStory = async (req, res) => {
    // IMMEDIATE LOG - This will ALWAYS show if function is called
    console.log('🚨🚨🚨 [STORY CREATE] FUNCTION CALLED AT:', new Date().toISOString());
    console.log('🚨🚨🚨 [STORY CREATE] ENTRY POINT REACHED!');
    console.log('🚨🚨🚨 [STORY CREATE] CALL STACK:', new Error().stack);
    console.log('🚨🚨🚨 [STORY CREATE] Timestamp:', new Date().toISOString());
    console.log('🚨🚨🚨 [STORY CREATE] Process ID:', process.pid);
    console.log('🚨🚨🚨 [STORY CREATE] Memory usage:', process.memoryUsage());
    console.log('🚨🚨🚨 [STORY CREATE] Request object exists:', !!req);
    console.log('🚨🚨🚨 [STORY CREATE] Response object exists:', !!res);
    console.log('🚨🚨🚨 [STORY CREATE] Request method:', req?.method);
    console.log('🚨🚨🚨 [STORY CREATE] Request URL:', req?.url);
    console.log('🚨🚨🚨 [STORY CREATE] Request headers:', req?.headers ? Object.keys(req.headers) : 'No headers');
    
    try {
        console.log('🚨 [STORY CREATE] FUNCTION STARTED!');
        console.log('🚨 [STORY CREATE] Request method:', req.method);
        console.log('🚨 [STORY CREATE] Request URL:', req.url);
        console.log('🚨 [STORY CREATE] Request path:', req.path);
        console.log('🚨 [STORY CREATE] Request original URL:', req.originalUrl);
        console.log('🚨 [STORY CREATE] Request headers:', Object.keys(req.headers));
        console.log('🚨 [STORY CREATE] Content-Type:', req.headers['content-type']);
        console.log('🚨 [STORY CREATE] Authorization:', req.headers.authorization ? 'Present' : 'Missing');
        
        console.log('📖 [Story] Create story request received');
        console.log('📖 [Story] Request body:', req.body);
        console.log('📖 [Story] Request file:', req.file);
        console.log('📖 [Story] DEBUG - req.auth():', req.auth());
        console.log('📖 [Story] DEBUG - req.authUserId:', req.authUserId);
        
        const { userId } = req.auth();
        console.log('📖 [Story] User ID from auth:', userId);
        
        if (!userId) {
            console.error('🚨 [STORY CREATE] NO USER ID!');
            return res.json({ success: false, message: 'User not authenticated' });
        }
        
        const { content, media_type, background_color } = req.body;
        const media = req.file
        let media_url = ''

        console.log('📖 [Story] Story data:', { content, media_type, background_color, media: !!media });

        // upload media to imagekit
        if (media_type === 'image' || media_type === 'video'){
            if (!media) {
                console.error('📖 [Story] Error: media_type is', media_type, 'but no media file provided');
                return res.status(400).json({ success: false, message: 'Media file required for image/video stories' });
            }
            
            // Use buffer from memory storage
            const fileBuffer = media.buffer
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            media_url = response.url
            console.log('📖 [Story] Media uploaded to:', media_url);
        }
        
        console.log('🚨 [STORY CREATE] ABOUT TO SAVE TO DATABASE...');
        console.log('🚨 [STORY CREATE] Story model exists:', !!Story);
        
        // create story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        })
        
        console.log('🚨 [STORY CREATE] STORY SAVED TO DATABASE!');
        console.log('📖 [Story] Story created successfully:', story._id);
        console.log('📖 [Story] Story data:', JSON.stringify(story, null, 2));

        // schedule story deletion after 24 hours
        console.log('🔍 [Story] Attempting to schedule deletion for story:', story._id);
        console.log('🔍 [Story] Inngest client available:', !!inngest);
        console.log('🔍 [Story] Event Key available:', !!process.env.INNGEST_EVENT_KEY);
        
        try {
            const eventResult = await inngest.send({
                name: 'app/story.delete',
                data: { storyId: story._id }
            });
            console.log('✅ [Story] Inngest event sent successfully:', eventResult);
        } catch (inngestError) {
            console.error('❌ [Story] Failed to send Inngest event:', inngestError);
            console.error('❌ [Story] Error details:', {
                message: inngestError.message,
                status: inngestError.status,
                stack: inngestError.stack
            });
            // Continue with story creation even if Inngest fails
            console.log('⚠️ [Story] Continuing without Inngest scheduling');
        }

        console.log('🚨 [STORY CREATE] SENDING RESPONSE TO FRONTEND...');
        console.log('🚨 [STORY CREATE] Response data:', {success: true, storyId: story._id});
        res.json({success: true, storyId: story._id})
        console.log('🚨 [STORY CREATE] RESPONSE SENT!');
        console.log('🚨🚨🚨 [STORY CREATE] FUNCTION COMPLETED!');
    } catch (error) {
        console.error('🚨🚨🚨 [STORY CREATE] ERROR IN FUNCTION:', error);
        console.error('🚨 [STORY CREATE] ERROR CREATING STORY:', error);
        console.error('📖 [Story] Error creating story:', error);
        console.error('📖 [Story] Full error stack:', error.stack);
        res.json({ success: false, message: error.message })
    }
}

// get user stories
export const getStories = async (req, res) => {
    console.log('🚨 [STORY DEBUG] FUNCTION CALLED - VERSION 3.0 - DEPLOY CHECK');
    console.log('🚨🚨🚨 [STORY DEBUG] ENTRY POINT REACHED!');
    console.log('🚨🚨🚨 [STORY DEBUG] CALL STACK:', new Error().stack);
    console.log('🚨🚨🚨 [STORY DEBUG] Timestamp:', new Date().toISOString());
    console.log('🚨🚨🚨 [STORY DEBUG] Process ID:', process.pid);
    console.log('🚨🚨🚨 [STORY DEBUG] Memory usage:', process.memoryUsage());
    
    try {
        console.log('🚨 [STORY DEBUG] FUNCTION STARTED!');
        console.log('🚨 [STORY DEBUG] Request method:', req.method);
        console.log('🚨 [STORY DEBUG] Request URL:', req.url);
        console.log('🚨 [STORY DEBUG] Request path:', req.path);
        console.log('🚨 [STORY DEBUG] Request original URL:', req.originalUrl);
        console.log('🚨 [STORY DEBUG] Request headers:', Object.keys(req.headers));
        console.log('🚨 [STORY DEBUG] Content-Type:', req.headers['content-type']);
        console.log('🚨 [STORY DEBUG] Authorization:', req.headers.authorization ? 'Present' : 'Missing');
        
        console.log('📖 [Story] Get stories request received - VERSION 2.0');
        console.log('📖 [Story] DEBUG - req.auth():', req.auth());
        console.log('📖 [Story] DEBUG - req.authUserId:', req.authUserId);
        
        const { userId } = req.auth();
        console.log('📖 [Story] User ID from auth:', userId);
        
        const user = await User.findById(userId);
        if (!user) {
            console.log('📖 [Story] User not found:', userId);
            return res.json({ success: false, message: 'User not found' })
        }

        console.log('📖 [Story] User found:', user._id);
        console.log('📖 [Story] User connections:', user.connections);
        console.log('📖 [Story] User following:', user.following);

        // User connections and followings  
        const userIds = [userId, ...user.connections, ...user.following]
        console.log('📖 [Story] User IDs to fetch stories for:', userIds);

        // SIMPLIFIED: Just get all stories from the user and their connections
        const stories = await Story.find({
            user: {$in: userIds}
        }).populate('user').sort({ createdAt: -1 });

        console.log('📖 [Story] Found stories:', stories.length);
        console.log('📖 [Story] Stories data:', JSON.stringify(stories, null, 2));

        // DEBUG: Check if new story exists in database
        const allUserStories = await Story.find({user: userId}).sort({ createdAt: -1 });
        console.log('📖 [Story] All stories for current user:', allUserStories.length);
        console.log('📖 [Story] Latest story for user:', allUserStories[0]?._id);

        // DEBUG: Check if the new story ID exists in database
        console.log('📖 [Story] Checking if new story exists in DB...');
        const newStoryCheck = await Story.findById('692c03152c93022568b79446');
        console.log('📖 [Story] New story exists in DB:', !!newStoryCheck);
        if (newStoryCheck) {
            console.log('📖 [Story] New story data:', JSON.stringify(newStoryCheck, null, 2));
        }

        // TEMP FIX: Force include user's latest stories if missing
        if (allUserStories.length > stories.length) {
            console.log('🔧 [Story] FIX: Adding missing user stories');
            const userStoryIds = stories.map(s => s._id.toString());
            const missingStories = allUserStories.filter(s => !userStoryIds.includes(s._id.toString()));
            stories.unshift(...missingStories);
            console.log('🔧 [Story] Added', missingStories.length, 'missing stories');
        }

        res.json ({ success: true, stories: stories});
    } catch (error) {
        console.error('📖 [Story] Error getting stories:', error);
        res.json({ success: false, message: error.message})
    }
}