import { Inngest } from "inngest";
import { connectDB } from '../configs/db.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

// Debug environment variables
console.log('🔍 [Inngest] Environment Check:');
console.log('- INNGEST_EVENT_KEY exists:', !!process.env.INNGEST_EVENT_KEY);
console.log('- INNGEST_EVENT_KEY length:', process.env.INNGEST_EVENT_KEY?.length || 0);
console.log('- INNGEST_SIGNING_KEY exists:', !!process.env.INNGEST_SIGNING_KEY);
console.log('- INNGEST_SIGNING_KEY length:', process.env.INNGEST_SIGNING_KEY?.length || 0);

export const inngest = new Inngest({ 
  id: "my-app",
  name: "ArtWall App",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// Debug logging
console.log('🔍 [Inngest] Configuration:');
console.log('- App ID:', inngest.id);
console.log('- App Name:', inngest.name);
console.log('- Event Key configured:', !!process.env.INNGEST_EVENT_KEY);
console.log('- Signing Key configured:', !!process.env.INNGEST_SIGNING_KEY);

// 1. syncUserCreation
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    console.log('🔵 [Inngest] Processing user creation:', event.data.id);
    try {
      await connectDB();
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      
      if (!email_addresses?.[0]?.email_address) {
        throw new Error('No email address provided');
      }

      const email = email_addresses[0].email_address;
      let username = email.split('@')[0];
      
      const existingUser = await User.findOne({ 
        $or: [
          { _id: id },
          { email },
          { username }
        ]
      });

      if (existingUser) {
        return { 
          success: false, 
          message: 'User already exists',
          userId: existingUser._id
        };
      }

      const userData = {
        _id: id,
        email,
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || username,
        profile_picture: image_url || '',
        username
      };

      const newUser = await User.create(userData);
      
      return { success: true, userId: newUser._id };
    } catch (error) {
      console.error('🔴 [Inngest] Error creating user:', error);
      throw error;
    }
  }
);

// 2. syncUserUpdation
const syncUserUpdation = inngest.createFunction(
  { id: 'sync-user-updation' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    console.log('🔵 [Inngest] Processing user update:', event.data.id);
    try {
      await connectDB();
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      
      const email = email_addresses?.[0]?.email_address;
      const full_name = `${first_name || ''} ${last_name || ''}`.trim();
      
      const updateData = {};
      if (email) updateData.email = email;
      if (full_name) updateData.full_name = full_name;
      if (image_url) updateData.profile_picture = image_url;
      
      const updatedUser = await User.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error('User not found for update');
      }
      
      return { success: true, userId: updatedUser._id };
    } catch (error) {
      console.error('🔴 [Inngest] Error updating user:', error);
      throw error;
    }
  }
);

// 3. syncUserDeletion
const syncUserDeletion = inngest.createFunction(
  { id: 'sync-user-deletion' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    console.log('🔵 [Inngest] Processing user deletion:', event.data.id);
    try {
      await connectDB();
      const { id } = event.data;
      
      const deletedUser = await User.findByIdAndDelete(id);
      
      if (!deletedUser) {
        console.warn('⚠️ User not found for deletion:', id);
        return { success: false, message: 'User not found' };
      }
      
      return { success: true, userId: id };
    } catch (error) {
      console.error('🔴 [Inngest] Error deleting user:', error);
      throw error;
    }
  }
);

// 4. sendNewConnectionRequestReminder
const sendNewConnectionRequestReminder = inngest.createFunction(
  { 
    id: "send-new-connection-request-reminder",
    name: "Send New Connection Request Reminder",
    retries: 3,
  },
  { 
    event: "app/connection-request",
  },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run('send-connection-request-mail', async () => {
      await connectDB();
      
      const connection = await Connection.findById(connectionId)
        .populate('from_user_id to_user_id', 'full_name username email');
      
      if (!connection) {
        throw new Error('Connection not found');
      }

      const subject = `👋 New Connection Request`;
      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${connection.to_user_id.full_name},</h2>
        <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
        <p>Click <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
        <br/>
        <p>Thanks, <br/>ArtWall - Stay Connected</p>
      </div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body
      });
    });

    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    
    await step.run('send-connection-request-reminder', async () => {
      await connectDB();
      
      const connection = await Connection.findById(connectionId)
        .populate('from_user_id to_user_id', 'full_name username email');

      if (connection.status === "accepted") {
        return { message: "Already accepted" };
      }

      const subject = `👋 Reminder: Connection Request Pending`;
      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${connection.to_user_id.full_name},</h2>
        <p>Reminder: You have a pending connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
        <p>Click <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
        <br/>
        <p>Thanks, <br/>ArtWall - Stay Connected</p>
      </div>`;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body
      });

      return { message: 'Reminder sent.' };
    });
  }
);

// 5. deleteStory
const deleteStory = inngest.createFunction(
  { id: 'story-delete' },
  { event: 'app/story.delete' },
  async ({ event, step }) => {
    const { storyId } = event.data;
    
    // Wait 24 hours before deleting
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-24-hours-before-delete", in24Hours);
    
    await step.run("delete-story", async () => {
      await connectDB();
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted after 24 hours." };
    });
  }
);

// 6. sendNotificationOfUnseenMessages
const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 9 * * *" },
  async ({ step }) => {
    try {
      await connectDB();
      
      const messages = await Message.find({ seen: false }).populate('to_user_id');
      const unseenCount = {};

      messages.map(message => {
        unseenCount[message.to_user_id._id] = (unseenCount[message.to_user_id._id] || 0) + 1;
      });

      for (const userId in unseenCount) {
        const user = await User.findById(userId);
        
        if (!user) continue;
        
        const subject = `You have ${unseenCount[userId]} unseen messages`;
        const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
             <h2>Hi ${user.full_name},</h2>
             <p>You have ${unseenCount[userId]} unseen messages</p>
             <p>Click <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/messages" style="color: #10b981;">here</a> to view them</p>
             <br>
             <p>Thanks, <br/>ArtWall - Stay Connected</p>
        </div>
        `;
        
        await sendEmail({
          to: user.email,
          subject,
          body
        });
      }
      return { message: 'notification sent' };
    } catch (error) {
      console.error('Error in sendNotificationOfUnseenMessages:', error);
      throw error;
    }
  }
);

export function getInngestFunctions() {
  const functions = [
    syncUserCreation, 
    syncUserUpdation, 
    syncUserDeletion, 
    sendNewConnectionRequestReminder,
    deleteStory,
    sendNotificationOfUnseenMessages
  ];
  
  // console.log('🔍 Debug functions:');
  // functions.forEach((fn, index) => {
  //   console.log(`Function ${index}:`, fn?.opts?.id || 'no-id');  // ← Gunakan opts.id
  // });
  
  return functions.filter(Boolean);
}