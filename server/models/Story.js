import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    // Match User _id which is a String (Clerk userId)
    user: {type: String, ref: 'User', required: true},
    content: {type: String},
    media_url: {type: String},
    media_type: {type: String, enum: ['text', 'image', 'video'], required: true},
    // Keep views_count as String refs to User as well
    views_count: [{type: String, ref: 'User'}],
    background_color: { type: String },
}, {timestamps: true, minimize: false})

// Validation: ensure at least content or media_url is provided
storySchema.pre('save', function(next) {
    if (!this.content && !this.media_url) {
        return next(new Error('Story must have either content or media'));
    }
    next();
})

const Story = mongoose.model('Story', storySchema)

export default Story;   