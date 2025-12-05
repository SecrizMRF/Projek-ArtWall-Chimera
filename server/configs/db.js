import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    console.log(' [DB] connectDB() function called!');
    console.log(' [DB] Environment check:');
    console.log(' [DB] MONGODB_URL exists:', !!process.env.MONGODB_URL);
    console.log(' [DB] MONGODB_URL length:', process.env.MONGODB_URL?.length || 0);
    console.log(' [DB] MONGODB_URL preview:', process.env.MONGODB_URL?.substring(0, 20) + '...');
    
    if (mongoose.connection.readyState === 1) {
      console.log(' [DB] Using existing database connection');
      console.log(' [DB] Connection state:', mongoose.connection.readyState);
      return;
    }

    console.log(' [DB] Attempting to connect to MongoDB...');
    const db = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: 'artwall',
      bufferCommands: false,
      maxPoolSize: 20, 
      serverSelectionTimeoutMS: 15000, 
      socketTimeoutMS: 60000,
      connectTimeoutMS: 10000, 
      heartbeatFrequencyMS: 10000, 
      retryWrites: true, 
      w: 'majority' 
    });
    
    console.log('MongoDB connected successfully to database:', db.connection.name);
    console.log(' [DB] Connection ready state:', mongoose.connection.readyState);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => console.log('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));