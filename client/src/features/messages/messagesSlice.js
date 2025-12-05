import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
    messages: []
}

export const fetchMessages = createAsyncThunk('messages/fetchMessages', async (userId) => {
    console.log('📨 Redux: Fetching messages for userId:', userId);
    const { data } = await api.post('/api/messages/get', {to_user_id: userId})
    console.log('📨 Redux: API response:', data);
    return data.success ? data : null
})

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action)=>{
            state.messages = action.payload;
        },
        addMessage: (state, action)=>{
            state.messages = [...state.messages, action.payload];
        },
        resetMessages: (state)=>{
            state.messages = [];
        },

    },
    extraReducers: (builder)=>{
        builder.addCase(fetchMessages.fulfilled, (state, action)=>{
            console.log(' Redux: fetchMessages fulfilled, payload:', action.payload);
            if(action.payload){
                state.messages = action.payload.messages || []
                console.log(' Redux: Messages updated in state:', state.messages.length);
            }
        })
        .addCase(fetchMessages.pending, (state, action)=>{
            console.log(' Redux: fetchMessages pending for userId:', action.meta.arg);
        })
        .addCase(fetchMessages.rejected, (state, action)=>{
            console.error(' Redux: fetchMessages rejected:', action.error);
        })
    }
})

export const {setMessages, addMessage, resetMessages} = messagesSlice.actions;

export default messagesSlice.reducer;