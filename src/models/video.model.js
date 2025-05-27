import mongoose, {Schema} from "mongoose"

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary url of the video file
            required: true

        },

        thumbnail: {
            type: String, // cloudinary url of the thumbnail image
            required: true
        },

        title: {
            type: String,
            required: true
            
        },
        description: {
            type: String,
            required: true
           
        },

        duration: {
            type: Number, // Duration in seconds , cloudinary duration
            required: true
        },

        views: {
            type: Number,
            default: 0 // Default value for views
        },

        isPublished: {
            type: Boolean,
            default: true // Default value for isPublished
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
        }



        
    },{timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate) // Plugin for pagination, used for aggregate queries

export const Video = mongoose.model("Video",videoSchema)