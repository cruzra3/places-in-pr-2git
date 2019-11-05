const mongoose = require("mongoose");

// SCHEMA SETUP
const placeSchema = new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Comment",
           usePushEach: true
        }
     ]
    });
     
const Place = mongoose.model("Place", placeSchema);
module.exports = Place;
