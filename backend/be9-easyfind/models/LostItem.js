const mongoose = require('mongoose');

const LostItemSchema = new mongoose.Schema({
    itemName:{
        type:String,
    },
    category: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    dateLost: {
        type: Date,
        default: Date.now,
    },
    email:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status: {
        type: String,
        enum: ["pending", "match-found", "verified", "claimed", "not-found", "rejected"],
        default: "pending",
    }
}, { timestamps: true });

module.exports = mongoose.model('LostItem', LostItemSchema);