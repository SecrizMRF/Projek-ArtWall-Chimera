import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'


const initialState = {
    connections: [],
    pendingConnections: [],
    follower: [],
    following: []
}

export const fetchConnections = createAsyncThunk('connections/fetchConnections', async() => {
    const response = await api.post('/api/users/connections')
    return response.data
})

const connectionsSlice = createSlice({
    name: 'connections',
    initialState,
    reducers: {

    },
    extraReducers: (builder) =>{
        builder.addCase(fetchConnections.fulfilled, (state,action)=>{
            if(action.payload){
                state.connections = action.payload.connections
                state.pendingConnections = action.payload.pendingConnections
                state.followers = action.payload.followers
                state.following = action.payload.following
            }
        })
    }
})

export default connectionsSlice.reducer