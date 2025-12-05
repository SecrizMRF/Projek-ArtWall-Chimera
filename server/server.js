// Di server.js, hapus semua yang duplicate dan gunakan ini:

import 'dotenv/config';
console.log('🚀 Server starting...');

import { connectDB } from './configs/db.js';
import { inngest, getInngestFunctions } from './inngest/index.js';
import { serve } from 'inngest/express';
import userRouter from './routes/userRoutes.js';
import User from './models/User.js';
import { clerkMiddleware } from '@clerk/express'
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
const envPath = join(__dirname, '.env');
console.log('🔍 Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('❌ Error loading .env:', result.error);
} else {
    console.log('✅ .env loaded successfully');
    console.log('🔍 Available env vars:', Object.keys(process.env).filter(key => key.includes('IMAGEKIT')));
    console.log('🔑 Inngest Event Key exists:', !!process.env.INNGEST_EVENT_KEY);
    console.log('🔑 Inngest Signing Key exists:', !!process.env.INNGEST_SIGNING_KEY);
}

const app = express();

// Initialize database connection
await connectDB();
 
// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://artwall-fawn.vercel.app',
    'https://uas-server.vercel.app',
    'https://30novbe.vercel.app',
    'https://30novfe-seven.vercel.app',
    'https://new-frontend-url.com' // New frontend URL added to CORS
  ],
  credentials: true
}));

// SSE middleware - bypass CORS and auth for EventSource
app.use('/api/messages/:user_id', (req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://artwall-fawn.vercel.app','https://30novbe.vercel.app', 'https://30novfe-seven.vercel.app', 'https://uas-server.vercel.app', 'https://new-frontend-url.com']; // New frontend URL added to allowed origins
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  
  // Handle preflight OPTIONS requests for SSE
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(200).end();
  }
  
  next();
});

// CORS middleware for messages/recent endpoint
app.use('/api/messages/recent', (req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://artwall-fawn.vercel.app','https://30novbe.vercel.app', 'https://30novfe-seven.vercel.app', 'https://uas-server.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(clerkMiddleware());

// Debug logging
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.url}`);
  console.log('🔍 Request headers:', Object.keys(req.headers));
  console.log('🔍 Origin:', req.headers.origin);
  console.log('🔍 Cookie:', req.headers.cookie);
  console.log('🔍 Request params:', req.params);
  console.log('🔍 Request query:', req.query);
  
  // DEBUG: Check if this is a stories request
  if (req.url.includes('/stories')) {
    console.log('🚨 [STORIES ROUTE] Stories request detected!');
    console.log('🚨 [STORIES ROUTE] Full URL:', req.url);
    console.log('🚨 [STORIES ROUTE] Method:', req.method);
    console.log('🚨 [STORIES ROUTE] Path:', req.path);
  }
  
  if (req.url.includes('/api/users')) {
    console.log('👤 User API request details:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'],
        'origin': req.headers.origin,
        'referer': req.headers.referer,
        'cookie': req.headers.cookie
      }
    });
  }
  if (req.url.includes('/messages')) {
    console.log('📨 Message request details:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      params: req.params,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'origin': req.headers.origin,
        'referer': req.headers.referer
      }
    });
  }
  next();
});

// Initialize Inngest functions
const inngestFunctions = getInngestFunctions();
console.log('🔍 Registered Inngest functions:', 
  inngestFunctions.map(f => f?.opts?.id || 'no-id').join(', ')
);

// Inngest CORS + middleware (sebelum serve)
app.use('/api/inngest', cors({
  origin: '*',
  credentials: true
}));

app.use('/api/inngest', (req, res, next) => {
  console.log('🔍 Inngest dashboard request:', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
  next();
});

// Serve Inngest API (hanya sekali!)
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: inngestFunctions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
    landingPage: true,
  })
);

// Test recent messages endpoint directly (BEFORE router and SSE)
app.get('/api/messages/recent', async (req, res) => {
    try {
        console.log('📨 Direct recent messages endpoint called');
        
        // Get user ID from auth
        let userId = null;
        if (req.auth) {
            const auth = req.auth();
            userId = auth?.userId;
        }
        
        if (!userId && req.authUserId) {
            userId = req.authUserId;
        }
        
        console.log('📨 getUserRecentMessages called for userId:', userId);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }
        
        // Get messages where user is either sender OR receiver
        const Message = (await import('./models/Message.js')).default;
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
});

// SSE endpoint - TANPA middleware untuk EventSource compatibility
app.get('/api/messages/:user_id', (req, res, next) => {
    console.log('🔌 SSE: Direct endpoint hit');
    console.log('🔌 SSE: req.params:', req.params);
    console.log('🔌 SSE: req.url:', req.url);
    
    const { user_id } = req.params;
    
    // Skip if user_id is "recent" - this should be handled by the recent messages endpoint
    if (user_id === 'recent') {
        console.log('🔌 SSE: Skipping recent endpoint - should be handled by recent messages route');
        return next(); // Let the next handler handle it
    }
    
    if (!user_id) {
        console.error('🔌 SSE: ERROR - No user_id provided!');
        return res.status(400).json({ error: 'User ID required' });
    }

    console.log('🔌 SSE: Connecting user:', user_id);

    // Initialize global connections if not exists
    if (!global.connections) {
        global.connections = {};
    }
    
    console.log('🔌 SSE: Active connections before:', Object.keys(global.connections));

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive'); 
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://artwall-fawn.vercel.app','https://30novbe.vercel.app', 'https://30novfe-seven.vercel.app', 'https://uas-server.vercel.app'];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Add to connections
    global.connections[user_id] = res;

    console.log('🔌 SSE: Connection stored for user:', user_id);
    console.log('🔌 SSE: Active connections after:', Object.keys(global.connections));

    // Send initial event
    res.write('data: Connected to SSE stream\n\n');
    console.log('🔌 SSE: Initial handshake sent to:', user_id);

    // Handle disconnection
    req.on('close', () => {
        delete global.connections[user_id];
        console.log('🔌 SSE: Client disconnected:', user_id);
        console.log('🔌 SSE: Remaining connections:', Object.keys(global.connections));
    });
});

// Routes
console.log('🚀 [ROUTES] Registering routes...');
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/stories', storyRouter);
app.use('/api/messages', messageRouter); // For /send and /get only
console.log('🚀 [ROUTES] All routes registered!');

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('📨 Test endpoint called');
    res.json({ success: true, message: 'Server is responding!' });
});

// Health check
app.get('/', (req, res) => {
    res.send('ArtWall Server is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});