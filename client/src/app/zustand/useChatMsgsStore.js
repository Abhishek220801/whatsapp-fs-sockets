import {create} from 'zustand';

export const useChatMsgsStore = create((set) => ({
   chatMsgs: [],
   updateChatMsgs: (chatMsgs) => set((state)=>({chatMsgs: 
      typeof chatMsgs==='function' ? chatMsgs(state.chatMsgs) : chatMsgs
   }))
}));
