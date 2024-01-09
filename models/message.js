const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    channelName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date
    },
    sender: {
        type: String,
        required: true
    },
    reciever: {
        type: String,
        required: true
    }

})

module.exports = mongoose.model('message',messageSchema)