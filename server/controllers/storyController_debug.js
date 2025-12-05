export const addUserStory = async (req, res) => {
    console.log('🚨🚨🚨 [STORY CREATE] FUNCTION CALLED AT:', new Date().toISOString());
    console.log('🚨🚨🚨 [STORY CREATE] ENTRY POINT REACHED!');
    
    try {
        console.log('🚨 [STORY CREATE] FUNCTION STARTED!');
        console.log('🚨 [STORY CREATE] Request method:', req.method);
        console.log('🚨 [STORY CREATE] Request URL:', req.url);
        console.log('🚨 [STORY CREATE] Request headers:', Object.keys(req.headers));
        console.log('🚨 [STORY CREATE] Content-Type:', req.headers['content-type']);
        console.log('🚨 [STORY CREATE] Authorization:', req.headers.authorization ? 'Present' : 'Missing');
        
        console.log('📖 [Story] Create story request received');
        console.log('📖 [Story] Request body:', req.body);
        console.log('📖 [Story] Request file:', req.file);
        
        // DEBUG AUTH STEP BY STEP
        console.log('📖 [Story] DEBUG - req.auth exists:', typeof req.auth);
        console.log('📖 [Story] DEBUG - req.auth:', req.auth);
        
        let userId;
        try {
            if (typeof req.auth === 'function') {
                console.log('📖 [Story] DEBUG - req.auth is a function, calling it...');
                const authResult = req.auth();
                console.log('📖 [Story] DEBUG - authResult:', authResult);
                userId = authResult?.userId || authResult;
            } else {
                console.log('📖 [Story] DEBUG - req.auth is not a function, trying direct property...');
                userId = req.auth?.userId || req.authUserId || req.user?.id;
            }
        } catch (error) {
            console.error('🚨 [STORY CREATE] AUTH ERROR:', error.message);
            console.error('🚨 [STORY CREATE] AUTH ERROR STACK:', error.stack);
            return res.status(401).json({ success: false, message: 'Authentication failed', error: error.message });
        }
        
        console.log('📖 [Story] User ID from auth:', userId);
        
        if (!userId) {
            console.error('🚨 [STORY CREATE] NO USER ID!');
            return res.json({ success: false, message: 'User not authenticated' });
        }
        
        // Return success for testing
        console.log('🚨 [STORY CREATE] AUTH SUCCESS - USER ID:', userId);
        return res.json({ success: true, message: 'Debug - Auth working', userId });
        
    } catch (error) {
        console.error('🚨 [STORY CREATE] ERROR:', error.message);
        console.error('🚨 [STORY CREATE] ERROR STACK:', error.stack);
        console.log('🚨🚨🚨 [STORY CREATE] FUNCTION COMPLETED WITH ERROR!');
        return res.json({ success: false, message: error.message });
    }
}

export const getStories = async (req, res) => {
    console.log('📖 [Story] Get stories request received');
    res.json({ success: true, stories: [] });
}
