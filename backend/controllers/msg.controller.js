import Conversation from "../models/chat.model.js";

export const addMsgToConversation = async (participants, msg) => {
    try{
        let conversation = await Conversation.findOne(
            {users: {$all: participants}}
        )
        if(!conversation) {
            conversation = await Conversation.create({users: participants})
        }

        conversation.msgs.push(msg);
        await conversation.save();
    } catch(err){
        console.log(`Error adding message to conversation: ${err.message}`)
    }
}

const getMsgsForConversation = async (req, res) => {
    try {
        const {sender, receiver} = req.query;
        console.log(sender + receiver);
        const participants = [sender, receiver];
        //Find conversation by participants
        const conversation = await Conversation.findOne({users: {$all: participants}})
        if(!conversation){
            console.log(`Conversation not found`);
        }
        return res.json(conversation.msgs);
    } catch (err) {
        console.error(`Error fetching messages: ${err}`);
        res.status(500).json({error: 'Server error'});
    }
}

export default getMsgsForConversation;