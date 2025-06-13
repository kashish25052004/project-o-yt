import mongoose,{ Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {
        type:Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model for the subscriber
        
    },

    channel: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model for the channel being subscribed to
    }
},{timestamps: true});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
