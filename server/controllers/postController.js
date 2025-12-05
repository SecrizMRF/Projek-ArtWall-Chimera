import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";  // Tambahkan .js
import User from "../models/User.js";  // Sudah benar

// Add Post
export const addPost = async (req, res) => {
    console.log('🚨🚨🚨 [POST CREATE] FUNCTION STARTED');
    console.log('🚨 [POST] Request method:', req.method);
    console.log('🚨 [POST] Request URL:', req.url);
    console.log('🚨 [POST] Content-Type:', req.headers['content-type']);
    console.log('🚨 [POST] Auth check - req.auth exists:', !!req.auth);
    
    try {
        const { userId } = req.auth();
        console.log('🚨 [POST] User ID from auth:', userId);
        
        const { content, post_type } = req.body;
        console.log('🚨 [POST] Request body:', { content, post_type });
        
        const images = req.files
        console.log('🚨 [POST] Files received:', images);
        console.log('🚨 [POST] Images array length:', images?.length);
        
        if (images && images.length > 0) {
            console.log('🚨 [POST] Processing', images.length, 'images');
            images.forEach((image, index) => {
                console.log(`🚨 [POST] Image ${index}:`, {
                    originalname: image.originalname,
                    size: image.size,
                    bufferExists: !!image.buffer,
                    bufferLength: image.buffer?.length,
                    path: image.path,
                    mimetype: image.mimetype
                });
            });
        }

        let image_urls = []

        if (images.length){
            console.log('🚨 [POST] Starting image processing...');
            image_urls = await Promise.all(
                images.map(async (image, index) => {
                    console.log(`🚨 [POST] Processing image ${index}:`, image.originalname);
                    
                    // Use buffer from memory storage instead of reading from disk
                    if (!image.buffer) {
                        console.error(`🚨 [POST] ERROR: No buffer for image ${index}`);
                        console.error(`🚨 [POST] Image object:`, Object.keys(image));
                        throw new Error('Invalid file upload - no data buffer');
                    }
                    
                    console.log(`🚨 [POST] Buffer size for image ${index}:`, image.buffer.length);
                    
                    const fileName = `post_${userId}_${Date.now()}_${image.originalname || 'image'}`
                    console.log(`🚨 [POST] Generated filename:`, fileName);
                    
                    try {
                        console.log(`🚨 [POST] Starting ImageKit upload for image ${index}...`);
                        const response = await imagekit.upload({
                            file: image.buffer,
                            fileName: fileName,
                            folder: "posts",
                            useUniqueFileName: false
                        });
                        console.log(`🚨 [POST] ImageKit upload successful for image ${index}:`, response.url);
                        
                        const url = imagekit.url({
                            path: response.filePath,
                            transformation: [
                                { quality: 'auto' },
                                { format: 'webp' },
                                { width: '1280' }
                            ]
                        });
                        console.log(`🚨 [POST] Generated URL for image ${index}:`, url);
                        return url
                    } catch (uploadError) {
                        console.error(`🚨 [POST] ImageKit upload error for image ${index}:`, uploadError);
                        throw uploadError;
                    }
                })
            )
            console.log('🚨 [POST] All images processed successfully');
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })
        res.json({ success: true, message: "Post created successfully"});
    } catch (error) {
        console.error('🚨🚨🚨 [POST CREATE] CATCH BLOCK ERROR');
        console.error('🚨 [POST] Error type:', error.constructor.name);
        console.error('🚨 [POST] Error message:', error.message);
        console.error('🚨 [POST] Error code:', error.code);
        console.error('🚨 [POST] Error stack:', error.stack);
        console.error('🚨 [POST] Full error:', error);
        
        // Check if it's the specific path error
        if (error.message.includes('path') && error.message.includes('must be of type string')) {
            console.error('🚨🚨🚨 [POST] THIS IS THE PATH ERROR WE ARE LOOKING FOR!');
            console.error('🚨 [POST] Checking req.files:', req.files);
            console.error('🚨 [POST] Checking req.file:', req.file);
            
            if (req.files) {
                req.files.forEach((file, index) => {
                    console.error(`🚨 [POST] File ${index} details:`, {
                        originalname: file.originalname,
                        path: file.path,
                        buffer: !!file.buffer,
                        size: file.size,
                        mimetype: file.mimetype
                    });
                });
            }
        }
        
        res.json({ success: false, message: error.message });
    }
}

// Get Posts
export const getFeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);

        // User connections and followings
        const userIds = [userId, ...user.connections, ...user.following];
        
        // Query dengan sorting di database level
        const posts = await Post.find({ user: { $in: userIds } })
            .populate('user')
            .sort({ createdAt: -1 }); // Sort descending by creation date

        res.json({ success: true, posts });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Like Post
export const likePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;

        const post = await Post.findById(postId)

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user => user !== userId)
            await post.save()
            res.json({ success: true, message: 'Post unliked'});
        } else {
            post.likes_count.push(userId)
            await post.save()
            res.json({ success:true, message: 'Post liked'});
        }

        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}
