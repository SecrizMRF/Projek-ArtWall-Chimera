export const protect = async (req, res, next) => {
    console.log('\n🔐🔐🔐 [AUTH] START');
    
    try {
        // Try Clerk middleware first (for cookies)
        const auth = req.auth();
        console.log('🔐 [AUTH] req.auth() returned:', auth ? 'object' : 'null/undefined');
        
        if (auth && auth.userId) {
            console.log('🔐 [AUTH] ✅ Authenticated via Clerk cookies:', auth.userId);
            req.authUserId = auth.userId;
            next();
            return;
        }
        
        // Try JWT token from Authorization header
        const authHeader = req.headers.authorization;
        console.log('🔐 [AUTH] Authorization header:', authHeader ? 'present' : 'missing');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            console.log('🔐 [AUTH] Found Bearer token, verifying...');
            
            try {
                const { clerkClient } = await import('@clerk/clerk-sdk-node');
                const verifiedToken = await clerkClient.verifyToken(token);
                
                if (verifiedToken && verifiedToken.sub) {
                    console.log('🔐 [AUTH] ✅ Authenticated via JWT:', verifiedToken.sub);
                    req.authUserId = verifiedToken.sub;
                    next();
                    return;
                }
            } catch (jwtError) {
                console.error('🔐 [AUTH] JWT verification failed:', jwtError.message);
            }
        }
        
        console.error('🔐 [AUTH] ❌ No valid auth found');
        return res.status(401).json({ 
            success: false, 
            message: 'User not authenticated' 
        });
        
    } catch (error) {
        console.error('🔐 [AUTH] ❌ Middleware error:', error.message);
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed: ' + error.message 
        });
    }
};