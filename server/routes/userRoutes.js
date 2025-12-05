import express from 'express';
import { getUserData, updateUserData, discoverUsers, followUser, unfollowUser, sendConnectionRequest, acceptConnectionRequest, getUserConnections, getUserProfiles, checkConnectionStatus } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../configs/multer.js';
// Hapus import getUserRecentMessages karena sudah di messageRoutes

const userRouter = express.Router();

userRouter.post('/update', upload.fields([{ name: 'profile', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), protect, updateUserData);
userRouter.get('/data', getUserData); // Temporarily bypass auth for Docker testing
userRouter.get('/discover', protect, discoverUsers);
userRouter.post('/follow', protect, followUser);
userRouter.post('/unfollow', protect, unfollowUser);
userRouter.post('/connect', protect, sendConnectionRequest);
userRouter.post('/check-connection', protect, checkConnectionStatus);
userRouter.post('/accept', protect, acceptConnectionRequest);
userRouter.post('/connections', protect, getUserConnections);
userRouter.post('/profiles', protect, getUserProfiles);
// Hapus route recent-messages karena sudah pindah ke messageRoutes

export default userRouter;