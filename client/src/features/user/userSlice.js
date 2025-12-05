import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'


const initialState = {
    value: null
}

export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
    console.log(' userSlice - Sending fetch request');
    const response = await api.get('/api/users/data')
    console.log(' userSlice - Fetch response:', response.data)
    return response.data.success ? response.data.user : null
})

export const updateUser = createAsyncThunk('user/updateUser', async (formData) => {
    console.log(' userSlice - Sending update request with FormData:');
    for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }
    
    const { data } = await api.post('/api/users/update', formData)
    
    console.log(' userSlice - Update response:', data);
    
    if(data.success){
        toast.success(data.message)
        return data.user
    }else{
        toast.error(data.message)
        return null
    } 
})

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {

    },
    extraReducers: (builder)=>{
        builder.addCase(fetchUser.fulfilled, (state, action)=> {
            state.value = action.payload
        }).addCase(updateUser.fulfilled, (state, action)=>{
            state.value = action.payload
        })
    }
})

export default userSlice.reducer