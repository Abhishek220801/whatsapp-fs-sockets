'use client'
import React, {useState, useEffect, useRef} from 'react';
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
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const socketRef = useRef(null);
    
    const authName = useAuthStore((state)=>state.authName);
    const {updateUsers} = useUsersStore();
    const {chatReceiver} = useChatReceiverStore();
    const {chatMsgs, updateChatMsgs} = useChatMsgsStore();
    const router = useRouter();
    const messagesEndRef = useRef(null);

    const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

    const getUserData = async () => {
        try {
            const res = await axios.get(`${AUTH_URL}/users`, {
                withCredentials: true
            });
            updateUsers(res.data);
            console.log('Users loaded:', res.data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    // Initialize socket connection - ONLY depends on authName
    useEffect(() => {
        if(!authName){
            router.replace('/');
            return;
        }

        console.log('🔌 Initializing socket connection for:', authName);
        
        // Create socket connection with proper config
        const newSocket = io(SOCKET_URL, {
            query: { username: authName.toLowerCase().trim() },
            transports: ["polling", "websocket"], // Allow polling fallback
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Store socket in ref to persist across renders
        socketRef.current = newSocket;
        setSocket(newSocket);

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setConnectionStatus('connected');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setConnectionStatus('disconnected');
        });

        newSocket.on('connect_error', (error) => {
            console.error('🔴 Connection error:', error.message);
            setConnectionStatus('error');
        });

        // Message handler
        newSocket.on('chat msg', (msg) => {
            console.log('📩 Received msg:', msg);
            // Only update messages if it's relevant to current conversation
            updateChatMsgs((prev) => {
                // Prevent duplicate messages
                const isDuplicate = prev.some(
                    m => m.text === msg.text && 
                    m.sender === msg.sender && 
                    m.receiver === msg.receiver &&
                    Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 1000
                );
                
                if (!isDuplicate) {
                    return [...prev, { ...msg, timestamp: msg.timestamp || new Date().toISOString() }];
                }
                return prev;
            });
        });

        // Scroll to bottom whenever new message arrives
    useEffect(() => {
        if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredMessages]);
        

        // Load users once
        getUserData();

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up socket connection');
            newSocket.off('chat msg');
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, [authName, SOCKET_URL, router]); // Removed chatMsgs from dependencies!

    // Filter messages for current conversation
    const filteredMessages = chatMsgs.filter(msg => 
        (msg.sender === authName && msg.receiver === chatReceiver) ||
        (msg.sender === chatReceiver && msg.receiver === authName)
    );

    const sendMsg = (e) => {
        e.preventDefault();
        
        if(!msg.trim()) return;
        
        if(!chatReceiver) {
            alert("Please select a user to chat with.");
            return;
        }

        if(!socketRef.current?.connected) {
            alert("Connection lost. Trying to reconnect...");
            socketRef.current?.connect();
            return;
        }

        const msgToBeSent = {
            text: msg.trim(),
            sender: authName,
            receiver: chatReceiver,
            timestamp: new Date().toISOString()
        };

        console.log('📤 Sending message:', msgToBeSent);
        
        // Emit message through socket
        socketRef.current.emit('chat msg', msgToBeSent);
        
        // Optimistically add to local state
        updateChatMsgs(prev => [...prev, msgToBeSent]);
        
        // Clear input
        setMsg('');
    }

    return (
        <div className='h-screen flex divide-x-4'>
            <div className='w-1/5 min-w-[180px]'>
                <ChatUsers/>
            </div>
            <div className='w-4/5 flex-1 flex flex-col'>
                <div className='h-16 p-4 border-b flex items-center justify-between'>
                    <h1 className='text-lg font-semibold'>
                        {authName} {chatReceiver && `→ ${chatReceiver}`}
                    </h1>
                    <span className={`text-sm px-2 py-1 rounded ${
                        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                        connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {connectionStatus}
                    </span>
                </div>
                
                <div className='flex-1 overflow-y-auto p-4'>
                    {filteredMessages.map((msg, index) => (
                        <div key={`${msg.sender}-${msg.timestamp}-${index}`} 
                             className={`m-3 p-1 ${msg.sender === authName ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block p-3 rounded-2xl max-w-xs break-words ${
                                msg.sender === authName ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                            }`}>
                                {msg.text}
                            </span>
                            <div className='text-xs text-gray-500 mt-1'>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef}></div>
                </div>
                
                <div className='h-20 p-4 border-t'>
                    <form onSubmit={sendMsg} className="w-full">  
                        <div className="relative">  
                            <input 
                                type="text"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                placeholder={chatReceiver ? "Type your message..." : "Select a user to chat"}
                                disabled={!chatReceiver || connectionStatus !== 'connected'}
                                className="block w-full p-4 pr-24 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button 
                                type="submit"
                                disabled={!chatReceiver || !msg.trim() || connectionStatus !== 'connected'}
                                className="text-white absolute right-2 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Chat;