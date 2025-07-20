import {Schema, model} from 'mongoose'

const msgSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
    receiver: {
        type: String,
        required: true,
    },
})

const conversationSchema = new Schema({
    users: [
        {
            type: String,
            required: true
        }
    ],
    msgs: [msgSchema]
})

const Conversation = model('Conversation', conversationSchema);

export default Conversation;