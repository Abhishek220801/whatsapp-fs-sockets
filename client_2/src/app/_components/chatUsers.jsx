import React, { useEffect } from 'react'
import { useUsersStore } from '../zustand/useUsersStore'
import { useChatReceiverStore } from '../zustand/useChatReceiverStore';
import { useChatMsgsStore } from '../zustand/useChatMsgsStore'
import { useAuthStore } from '../zustand/useAuthStore';
import axios from 'axios'

const ChatUsers = () => {
    const {users} = useUsersStore();
    const {chatReceiver, updateChatReceiver} = useChatReceiverStore();
    const {updateChatMsgs} = useChatMsgsStore();
    const {authName} = useAuthStore();

    const setChatReceiver = (user) => {
        updateChatReceiver(user.username);
    }    
      
    useEffect(() => {
        const getMsgs = async () => {
            console.log('getting msgs------------');
            const res = await axios.get('http://localhost:8080/msgs',
                {
                    params: {
                        'sender': authName,
                        'receiver': chatReceiver
                    }
                },
                {
                    withCredentials: true
                });
            if (res.data.length !== 0) {
                updateChatMsgs(res.data);
            } else {
                updateChatMsgs([]);
            }
        }
        if(chatReceiver) {
            getMsgs();
       }
    }, [chatReceiver]) 

    return (
        <div className="p-2 h-full overflow-y-auto">
            {users.map((user,i) => (
                <div 
                    onClick={() => setChatReceiver(user)}
                    className='bg-blue-300 rounded-xl m-3 p-5'
                    key={user._id || i}
                    title={user.username}
                >
                    <span className="block truncate text-sm w-full">
                        { user.username }
                    </span>
                </div>
            ))}
        </div>
    )
}

export default ChatUsers