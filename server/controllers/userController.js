import User from "../models/User.js";
import Post from "../models/Post.js";
import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Connection from "../models/Connection.js"
import { inngest } from "../inngest/index.js"

// Get User Data using userId from auth middleware
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth().userId; // From Clerk middleware
        
        let user = await User.findById(userId);
        
        // Create user if doesn't exist in local DB
        if (!user) {
            user = await User.create({
                _id: userId,
                email: `${userId}@temp.com`,
                username: userId.slice(-8),
                full_name: 'Docker User',
                connections: [],
                following: [],
                followers: []
            });
        }
        
        return res.json({ 
            success: true, 
            user: user 
        });

    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error fetching user data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateUserData = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth()?.userId;
        let { username, bio, location, full_name } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User ID not found" });
        }

        const tempUser = await User.findById(userId);
        if (!tempUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Jika username tidak provided, gunakan yang lama
        if (!username) {
            username = tempUser.username;
        }

        // Cek jika username sudah dipakai user lain
        if (tempUser.username !== username) {
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Username already taken" 
                });
            }
        }

        const updatedData = {
            username,
            bio: bio || tempUser.bio,
            location: location || tempUser.location, 
            full_name: full_name || tempUser.full_name
        };

        const profile = req.files?.profile?.[0];
        const cover = req.files?.cover?.[0];

        console.log('Files received:', { profile: !!profile, cover: !!cover });
        console.log('Profile file:', profile);
        console.log('Cover file:', cover);

        // Handle profile picture upload
        if (profile) {
            try {
                // Use buffer from memory storage instead of reading from disk
                if (!profile.buffer) {
                    throw new Error('Invalid profile file upload - no data buffer');
                }
                
                const response = await imagekit.upload({
                    file: profile.buffer,
                    fileName: `profile_${userId}_${Date.now()}_${profile.originalname || 'image'}`,
                    folder: "/artwall/profiles",
                    useUniqueFileName: false
                });

                const url = imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: 'auto' },
                        { format: 'webp' },
                        { width: '512' }
                    ]
                });
                updatedData.profile_picture = url;
                
            } catch (uploadError) {
                console.error('Profile picture upload error:', uploadError);
                // Continue without failing the whole request
            }
        }

        // Handle cover photo upload
        if (cover) {
            try {
                // Use buffer from memory storage instead of reading from disk
                if (!cover.buffer) {
                    throw new Error('Invalid cover file upload - no data buffer');
                }
                
                const response = await imagekit.upload({
                    file: cover.buffer,
                    fileName: `cover_${userId}_${Date.now()}_${cover.originalname || 'image'}`,
                    folder: "/artwall/covers",
                    useUniqueFileName: false
                });

                const url = imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: 'auto' },
                        { format: 'webp' },
                        { width: '1280' }
                    ]
                });
                updatedData.cover_photo = url;
                
            } catch (uploadError) {
                console.error('Cover photo upload error:', uploadError);
                // Continue without failing the whole request
            }
        }
        
        const user = await User.findByIdAndUpdate(
            userId, 
            updatedData, 
            { new: true, runValidators: true }
        );
        
        res.json({ 
            success: true, 
            user, 
            message: 'Profile updated successfully' 
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Find Users using username, email, location, name
export const discoverUsers = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth()?.userId;
        const { input } = req.query;

        if (!input || input.length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: "Search input must be at least 2 characters long" 
            });
        }

        const allUsers = await User.find({
            $or: [
                { username: new RegExp(input, 'i') },
                { email: new RegExp(input, 'i') },
                { full_name: new RegExp(input, 'i') },
                { location: new RegExp(input, 'i') },
            ]
        }).select('-email -__v'); // Exclude sensitive fields

        const filteredUsers = allUsers.filter(user => user._id.toString() !== userId);

        res.json({ success: true, users: filteredUsers });

    } catch (error) {
        console.error('Discover users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Follow user
export const followUser = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth()?.userId;
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        if (userId === id) {
            return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        const user = await User.findById(userId);
        const toFollowUser = await User.findById(id);

        if (!user || !toFollowUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.following.includes(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already following this user' 
            });
        }

        // Add to following list
        user.following.push(id);
        await user.save();

        // Add to followers list
        toFollowUser.followers.push(userId);
        await toFollowUser.save();

        res.json({ success: true, message: 'Now you are following this user' });

    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Unfollow user
export const unfollowUser = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth()?.userId;
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const user = await User.findById(userId);
        const toUnfollowUser = await User.findById(id);

        if (!user || !toUnfollowUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove from following list
        user.following = user.following.filter(followId => followId.toString() !== id);
        await user.save();

        // Remove from followers list
        toUnfollowUser.followers = toUnfollowUser.followers.filter(
            followerId => followerId.toString() !== userId
        );
        await toUnfollowUser.save();

        res.json({ success: true, message: 'You are no longer following this user' });

    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Check Connection Status
export const checkConnectionStatus = async (req, res) => {
    try {
        const userId = req.authUserId || req.auth()?.userId;
        const { id } = req.body;

        if (!userId || !id) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and target ID are required' 
            });
        }

        // Check if users are already connected
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ]
        });

        let status = 'none';
        if (connection) {
            if (connection.status === 'accepted') {
                status = 'connected';
            } else {
                status = 'pending';
            }
        }

        res.json({
            success: true, 
            status: status
        });

    } catch (error) {
        console.error('Check connection status error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Send Connection Request
export const sendConnectionRequest = async (req, res) => {
    try {
        console.log('🔍 Connection request - req.authUserId:', req.authUserId);
        console.log('🔍 Connection request - req.body:', req.body);
        
        const userId = req.authUserId || req.auth()?.userId;
        const { id } = req.body;

        console.log('🔍 Parsed - userId:', userId, 'targetId:', id);

        if (!userId || !id) {
            console.log('❌ Validation failed');
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and target ID are required' 
            });
        }

        // Check if user has sent more than 20 connection requests in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const connectionRequests = await Connection.find({
            from_user_id: userId, 
            createdAt: { $gt: last24Hours }
        });
        
        if (connectionRequests.length >= 20) {
            return res.status(429).json({
                success: false, 
                message: 'You have sent more than 20 connection requests in the last 24 hours'
            });
        }

        // Check if users are already connected
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ]
        });

        if (!connection) {
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id
            });

            // Trigger Inngest event
            await inngest.send({
                name: "app/connection-request",
                data: {
                    connectionId: newConnection._id
                }
            });

            return res.json({
                success: true, 
                message: 'Connection request sent successfully' 
            });
        } else if (connection && connection.status === 'accepted') {
            return res.status(400).json({
                success: false, 
                message: 'You are already connected with this user'
            });
        }

        // Connection request already pending
        return res.json({
            success: true, 
            message: 'Connection request already sent'
        });

    } catch (error) {
        console.error('Send connection request error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


// Get User Connections
export const getUserConnections = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId).populate('connections followers following')

        const connections = user.connections
        const followers = user.followers
        const following = user.following

        const pendingConnections = ((await Connection.find({to_user_id: userId, status: 'pending'}).populate('from_user_id')).map(connection=>connection.from_user_id))

        res.json({success: true, connections, followers, following, pendingConnections})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
        };
    }

// Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const connection = await Connection.findOne({from_user_id: id, to_user_id: userId})

        if(!connection){
            return res.json({success: false, message: 'Connection not found'});
        }

        const user = await User.findById(userId);
        user.connections.push(id);
        await user.save()
        
        const toUser = await User.findById(id);
        toUser.connections.push(userId);
        await toUser.save()

        connection.status = 'accepted';
        await connection.save()

        res.json({success: true, message: 'Connection accepted successfully'})


    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
        };
    }

// get user profiles
export const getUserProfiles = async (req,res) => {
    try {
        const { profileId } = req.body;
        const profile = await User.findById(profileId)
        if(!profile){
            return res.json ({success: false, message: "Profile not found"});
        }
        const posts = await Post.find({user: profileId}).populate('user')

        res.json({success: true, profile, posts})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message})
    }
}