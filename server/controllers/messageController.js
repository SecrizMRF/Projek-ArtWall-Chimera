import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js"; // ← Fix path
import User from "../models/User.js"; // ← Tambahkan import User

// Create an empty object to store SSE Event connection
const connections = global.connections = {}; // Make global for server.js access

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
    console.log('🔌 SSE: Request received');
    console.log('🔌 SSE: Full req object keys:', Object.keys(req));
    console.log('🔌 SSE: req.params:', req.params);
    console.log('🔌 SSE: req.url:', req.url);
    console.log('🔌 SSE: req.originalUrl:', req.originalUrl);
    console.log('🔌 SSE: req.path:', req.path);
    console.log('🔌 SSE: req.route:', req.route);
    
    // Try different ways to get userId
    let userId = req.params.userId;
    
    // If undefined, try parsing from URL
    if (!userId && req.url) {
        const match = req.url.match(/\/api\/messages\/(.+)$/);
        if (match) {
            userId = match[1];
            console.log('🔌 SSE: Extracted userId from URL:', userId);
        }
    }
    
    console.log('🔌 SSE: Final userId:', userId);
    console.log('🔌 SSE: Active connections before:', Object.keys(connections));

    if (!userId) {
        console.error('🔌 SSE: ERROR - No userId found!');
        return res.status(400).json({ 
            error: 'User ID required',
            debug: {
                params: req.params,
                url: req.url,
                originalUrl: req.originalUrl
            }
        });
    }

    console.log('🔌 SSE: New client connected:', userId);
    console.log('🔌 SSE: Active connections:', Object.keys(connections));

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive'); 
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Add the client's response object to the connections object
    connections[userId] = res;
    console.log('🔌 SSE: Connection stored for user:', userId);

    // Send an initial event to the client
    res.write('data: Connected to SSE stream\n\n');
    console.log('🔌 SSE: Initial handshake sent to:', userId);

    // Handle client disconnection
    req.on('close', () => {
        // Remove the client's response object from the connections object
        delete connections[userId];
        console.log('🔌 SSE: Client disconnected:', userId);
        console.log('🔌 SSE: Remaining connections:', Object.keys(connections));
    });
};

// send message
export const sendMessage = async (req, res) => {
    try {
        // Try multiple auth methods
        let userId = null;
        
        if (req.auth) {
            const auth = req.auth();
            userId = auth?.userId;
        }
        
        if (!userId && req.authUserId) {
            userId = req.authUserId;
        }
        
        if (!userId && req.userId) {
            userId = req.userId;
        }

        console.log('📨 sendMessage: Request received');
        console.log('📨 sendMessage: Auth methods checked:', {
            'req.auth()': req.auth ? req.auth().userId : 'no auth method',
            'req.authUserId': req.authUserId,
            'req.userId': req.userId,
            'Final userId': userId
        });

        const { to_user_id, text } = req.body;
        const image = req.file;

        console.log('📨 sendMessage: From:', userId, 'To:', to_user_id, 'Text:', text);

        if (!userId) {
            throw new Error('User authentication failed');
        }

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        if (message_type === 'image') {
            // Use buffer from memory storage instead of reading from disk
            if (!image.buffer) {
                throw new Error('Invalid image file upload - no data buffer');
            }
            
            const fileName = `message_${userId}_${to_user_id}_${Date.now()}_${image.originalname || 'image'}`
            
            const response = await imagekit.upload({
                file: image.buffer,
                fileName: fileName,
                useUniqueFileName: false
            });
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ]
            });
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        });

        console.log('💾 sendMessage: Message saved to DB:', message._id);
        res.json({ success: true, message });

        // Send message to BOTH users using SSE
        const messageWithUserData = await Message.findById(message._id)
            .populate('from_user_id', '_id full_name username profile_picture')
            .populate('to_user_id', '_id full_name username profile_picture');

        console.log('📤 SSE: Attempting to send message');
        console.log('📤 SSE: From:', userId, 'To:', to_user_id);
        console.log('📤 SSE: Active connections:', Object.keys(global.connections || {}));
        console.log('📤 SSE: Message data:', JSON.stringify(messageWithUserData, null, 2));

        const connections = global.connections || {};

        // Send to receiver
        if (connections[to_user_id]) {
            const sseData = `data: ${JSON.stringify(messageWithUserData)}\n\n`;
            connections[to_user_id].write(sseData);
            console.log('✅ SSE: Message sent to receiver:', to_user_id);
        } else {
            console.log('❌ SSE: No connection found for receiver:', to_user_id);
        }

        // Send to sender (so they see their own message in real-time)
        if (connections[userId]) {
            const sseData = `data: ${JSON.stringify(messageWithUserData)}\n\n`;
            connections[userId].write(sseData);
            console.log('✅ SSE: Message sent to sender:', userId);
        } else {
            console.log('❌ SSE: No connection found for sender:', userId);
        }

        console.log('❌ SSE: Available users:', Object.keys(connections));

    } catch (error) {
        console.error('❌ sendMessage Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// get chat messages
export const getChatMessages = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth()?.userId;
        const { to_user_id } = req.body;
        
        console.log('📨 getChatMessages called:', { from: userId, to: to_user_id });

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ]
        }).sort({ createdAt: -1 }); // ← Fix: created_at → createdAt

        console.log('📨 Found chat messages:', messages.length);

        // mark message as seen
        await Message.updateMany(
            { from_user_id: to_user_id, to_user_id: userId }, 
            { seen: true }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.error('❌ Error in getChatMessages:', error);
        res.json({ success: false, message: error.message });
    }
};

export const getUserRecentMessages = async (req, res) => {
    try {
        console.log('📨 getUserRecentMessages called!');
        
        // Send immediate response for testing
        res.json({ success: true, messages: [] });
        
        return; // Stop here for testing
        
        // Temporarily bypass auth for testing
        const userId = req.authUserId || req.auth()?.userId || 'user_369NCTBYDUJlIMvifPEmV25AiiW';
        console.log('📨 getUserRecentMessages called for userId:', userId);
        
        // Get messages where user is either sender OR receiver
        const messages = await Message.find({
            $or: [
                { to_user_id: userId },  // Messages received by user
                { from_user_id: userId } // Messages sent by user
            ]
        })
            .populate('from_user_id to_user_id')
            .sort({ createdAt: -1 });

        console.log('📨 Found messages:', messages.length);
        console.log('📨 Messages data:', JSON.stringify(messages, null, 2));

        res.json({ success: true, messages });
    } catch (error) {
        console.error('❌ Error in getUserRecentMessages:', error);
        res.json({ success: false, message: error.message });
    }
};