const mongoose = require('mongoose')
const channelSchema = new mongoose.Schema({
    channelName: {
        type: String,
        required: true
    },
    user1: {
        type: String,
        required: true
    },
    user2: {
        type: String,
        required: true
    },
    lastMessage: {
        type: Object,
    },
    user1LastCheck: {
        type: Date,
    },
    user2LastCheck: {
        type: Date,
    }


})



module.exports = mongoose.model('channel',channelSchema)