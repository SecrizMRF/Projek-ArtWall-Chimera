import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { addUserStory, getStories } from "../controllers/storyController.js";

const storyRouter = express.Router()

// Test route
storyRouter.get('/test', (req, res) => {
    console.log(' [STORY TEST] Test route called!');
    res.json({ success: true, message: 'Story routes working!' });
});

// Reordered: auth first, then multer to ensure consistent user resolution
storyRouter.post(
    '/create',
    (req, res, next) => {
        console.log(' [Route] POST /create - ENTRY POINT');
        console.log(' [Route] Request headers:', Object.keys(req.headers));
        console.log(' [Route] Content-Type:', req.headers['content-type']);
        next();
    },
    (req, res, next) => {
        console.log(' [Route] POST /create - before auth');
        next();
    },
    protect,
    (req, res, next) => {
        console.log(' [Route] POST /create - after auth');
        console.log(' [Route] Auth successful, proceeding to multer');
        next();
    },
    (req, res, next) => {
        console.log(' [Route] POST /create - before multer');
        next();
    },
    upload.single('media'),
    (req, res, next) => {
        console.log(' [Route] POST /create - after multer');
        console.log(' [Route] File uploaded:', req.file);
        next();
    },
    (req, res, next) => {
        console.log(' [Route] POST /create - calling controller');
        next();
    },
    addUserStory
)
storyRouter.get('/get', protect, getStories)
storyRouter.get('/get-v3', protect, getStories)

// DEBUG: Check all stories in database
storyRouter.get('/debug/all-stories', async (req, res) => {
    try {
        const Story = (await import('../models/Story.js')).default;
        const stories = await Story.find().populate('user').sort({ createdAt: -1 }).limit(20);
        console.log('📖 [DEBUG] All stories in DB:', stories.length);
        stories.forEach(s => {
            console.log(`  - ID: ${s._id}, user: ${s.user?._id || s.user}, type: ${s.media_type}, created: ${s.createdAt}`);
        });
        res.json({ success: true, count: stories.length, stories });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// DEBUG: Cleanup old stories manually
storyRouter.get('/debug/cleanup-old', async (req, res) => {
    try {
        const Story = (await import('../models/Story.js')).default;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Story.deleteMany({ createdAt: { $lt: twentyFourHoursAgo } });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default storyRouter