'use client'
import React, {useState, useEffect} from 'react';
import io from "socket.io-client";
import { useAuthStore } from '../zustand/useAuthStore';
import { useUsersStore } from '../zustand/useUsersStore';
import { useChatReceiverStore } from '../zustand/useChatReceiverStore';
import { useChatMsgsStore } from '../zustand/useChatMsgsStore';
import axios from "axios";
import ChatUsers from '../_components/chatUsers';
import { useRouter } from 'next/navigation';

const Chat = () => {

    const [msg, setMsg] = useState('');
    const [socket, setSocket] = useState(null);
    const authName = useAuthStore((state)=>state.authName);
    const {updateUsers} = useUsersStore();
    const {chatReceiver} = useChatReceiverStore();
    const {chatMsgs, updateChatMsgs} = useChatMsgsStore();
    const router = useRouter();

    const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

    const getUserData = async () => {
    const res = await axios.get(`${AUTH_URL}/users`,
        {
            withCredentials: true
        })
        updateUsers(res.data);
        console.log(res.data);
    }

    useEffect(() => {
        if(!authName){
            router.replace('/');
            return;
        };
        const newSocket = io(SOCKET_URL, {
            query: {
               username: authName.toLowerCase().trim()
            }
        });
        setSocket(newSocket);

        newSocket.on('chat msg', msg => {
            console.log('received msg on client ' + msg.text);
            if (msg.sender === chatReceiver || msg.receiver === chatReceiver || msg.sender === authName) {
                updateChatMsgs(prev => [...prev, msg]); 
            }
       });

       getUserData();

       return () => {
        newSocket.disconnect()
       };
},[authName,chatMsgs]);

   const sendMsg = (e) => {
       e.preventDefault();
       if(!msg.trim()) return;
       const msgToBeSent = {
            text: msg,
            sender: authName,
            receiver: chatReceiver
        };
       if(socket) {
           socket.emit('chat msg', msgToBeSent);
           updateChatMsgs(prev => [...prev, msgToBeSent]);
           setMsg('');
       } else if(!chatReceiver){
        alert("Please select a user to chat with.")
       }
   }
 
 return (
    <div className='h-screen flex divide-x-4'>
        <div className='w-1/5 min-w-[180px]'>
            <ChatUsers/>
        </div>
        <div className='w-4/5 flex-1 flex flex-col'>
            <div className='1/5'>
                <h1>
                    {authName} is chatting with {chatReceiver || ''}
                </h1>
            </div>
            <div className='msgs-container h-3/5 overflow-scroll'>
                {chatMsgs?.map((msg, index) => (
                    <div key={index} className={`m-3 p-1 ${msg.sender === authName ? 'text-right' : 'text-left'}`}>
                        <span className={`p-2 rounded-2xl ${msg.sender === authName ? 'bg-blue-200' : 'bg-green-200'}`}>
                        {msg.text}
                        </span>
                    </div>
                ))}
            </div>
            <div className='h-1/5 flex items-center justify-center'>
                <form onSubmit={sendMsg} className="w-1/2">  
                    <div className="relative">  
                        <input type="text"
                            value={msg}
                            onChange={(e) => setMsg(e.target.value)}
                            placeholder="Type your text here"
                            required
                            className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"  />
                        <button type="submit"
                            className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
   </div>
 )
}


export default Chat
