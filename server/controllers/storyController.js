import fs from "fs";
import mongoose from "mongoose";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

// Add user story
export const addUserStory = async (req, res) => {
    console.log('\n🚨🚨🚨 [STORY CREATE] START - Time:', new Date().toISOString());
    
    try {
        // Get userId from auth - try both sources
        const authObj = typeof req.auth === 'function' ? req.auth() : null;
        const userId = req.authUserId || authObj?.userId;
        
        console.log('🚨 [STORY CREATE] Auth resolved:');
        console.log('  - req.authUserId:', req.authUserId);
        console.log('  - req.auth()?.userId:', authObj?.userId);
        console.log('  - FINAL userId:', userId);
        
        if (!userId) {
            console.error('🚨 [STORY CREATE] ❌ NO USER ID - AUTH FAILED');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        
        const { content, media_type, background_color } = req.body;
        const media = req.file;
        let media_url = '';

        console.log('🚨 [STORY CREATE] Input data:');
        console.log('  - userId:', userId);
        console.log('  - content:', content);
        console.log('  - media_type:', media_type);
        console.log('  - hasMedia:', !!media);

        // Upload media if needed
        if (media_type === 'image' || media_type === 'video') {
            if (!media) {
                console.error('🚨 [STORY CREATE] Media type is', media_type, 'but no file provided');
                return res.status(400).json({ success: false, message: 'Media file required' });
            }
            
            if (!media.buffer) {
                console.error('🚨 [STORY CREATE] No buffer in file');
                return res.status(400).json({ success: false, message: 'Invalid file upload' });
            }
            
            const fileBuffer = media.buffer;
            const fileName = `story_${userId}_${Date.now()}_${media.originalname || 'file'}`;
            
            console.log('🚨 [STORY CREATE] Uploading to ImageKit:', fileName);
            
            try {
                const response = await imagekit.upload({
                    file: fileBuffer,
                    fileName: fileName,
                    useUniqueFileName: false
                });
                media_url = response.url;
                console.log('🚨 [STORY CREATE] ✅ Media uploaded:', media_url);
            } catch (uploadError) {
                console.error('🚨 [STORY CREATE] ImageKit error:', uploadError.message);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload media',
                    error: uploadError.message 
                });
            }
        }
        
        // Save to database
        console.log('🚨 [STORY CREATE] Saving story to DB...');
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        });
        
        console.log('🚨 [STORY CREATE] ✅ SAVED! Story ID:', story._id);
        console.log('🚨 [STORY CREATE] Story user field:', story.user, '(type:', typeof story.user + ')');

        // Schedule deletion
        try {
            await inngest.send({
                name: 'app/story.delete',
                data: { storyId: story._id }
            });
            console.log('🚨 [STORY CREATE] ✅ Inngest scheduled');
        } catch (inngestError) {
            console.error('🚨 [STORY CREATE] Inngest error (non-critical):', inngestError.message);
        }

        console.log('🚨 [STORY CREATE] ✅ SENDING RESPONSE');
        res.json({ success: true, storyId: story._id });
        console.log('🚨🚨🚨 [STORY CREATE] END - SUCCESS\n');
        
    } catch (error) {
        console.error('🚨🚨🚨 [STORY CREATE] ❌ ERROR:', error.message);
        console.error('🚨 [STORY CREATE] Stack:', error.stack);
        res.json({ success: false, message: error.message });
    }
}

// Get user stories
export const getStories = async (req, res) => {
    console.log('\n📖📖📖 [STORY GET] START - Time:', new Date().toISOString());
    
    try {
        // Get userId from auth - try both sources
        const authObj = typeof req.auth === 'function' ? req.auth() : null;
        const userId = req.authUserId || authObj?.userId;
        
        console.log('📖 [STORY GET] Auth resolved:');
        console.log('  - req.authUserId:', req.authUserId);
        console.log('  - req.auth()?.userId:', authObj?.userId);
        console.log('  - FINAL userId:', userId);
        
        if (!userId) {
            console.error('📖 [STORY GET] ❌ NO USER ID');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Get user and their connections/following
        const user = await User.findById(userId);
        if (!user) {
            console.error('📖 [STORY GET] ❌ User not found:', userId);
            return res.json({ success: false, message: 'User not found' });
        }

        console.log('📖 [STORY GET] User found:', user._id);
        console.log('📖 [STORY GET] Connections:', user.connections?.length || 0);
        console.log('📖 [STORY GET] Following:', user.following?.length || 0);

        // Cleanup old stories (older than 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await Story.deleteMany({ createdAt: { $lt: twentyFourHoursAgo } });
        console.log('📖 [STORY GET] Cleaned up old stories');

        // Build list of user IDs to fetch stories from
        const userIds = [userId, ...(user.connections || []), ...(user.following || [])];
        console.log('📖 [STORY GET] Fetching stories from', userIds.length, 'users');

        // Fetch connection/following stories
        const storiesConn = await Story.find({
            user: { $in: userIds }
        }).populate('user').sort({ createdAt: -1 });

        console.log('📖 [STORY GET] Connection/following stories:', storiesConn.length);

        // Fetch current user's own stories (to ensure they're included)
        const ownStories = await Story.find({ user: userId })
            .populate('user')
            .sort({ createdAt: -1 });

        console.log('📖 [STORY GET] Own stories:', ownStories.length);

        // Merge and deduplicate by _id
        const mergedMap = new Map();
        ownStories.forEach(s => mergedMap.set(String(s._id), s));
        storiesConn.forEach(s => {
            if (!mergedMap.has(String(s._id))) {
                mergedMap.set(String(s._id), s);
            }
        });
        const stories = Array.from(mergedMap.values());

        console.log('📖 [STORY GET] ✅ Final stories to return:', stories.length);
        console.log('📖 [STORY GET] Story IDs:', stories.map(s => s._id).join(', '));

        res.json({ success: true, stories });
        console.log('📖📖📖 [STORY GET] END - SUCCESS\n');
        
    } catch (error) {
        console.error('📖📖📖 [STORY GET] ❌ ERROR:', error.message);
        console.error('📖 [STORY GET] Stack:', error.stack);
        res.json({ success: false, message: error.message });
    }
}
