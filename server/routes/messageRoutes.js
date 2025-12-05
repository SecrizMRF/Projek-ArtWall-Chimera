import express from 'express';
import { getChatMessages, sendMessage, sseController, getUserRecentMessages } from '../controllers/messageController.js';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';

const messageRouter = express.Router();

messageRouter.get('/:user_id', sseController);
messageRouter.post('/send', upload.single('image'), sendMessage);
messageRouter.post('/get', protect, getChatMessages);
messageRouter.get('/recent', getUserRecentMessages); // Remove protect middleware temporarily

export default messageRouter;