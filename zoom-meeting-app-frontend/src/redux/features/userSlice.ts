// ** Redux Imports
import { createSlice } from '@reduxjs/toolkit'
// ** Types
import { UserStoreType } from '@/types/servicesTypes';

const initialState = {
  user: null,
} as UserStoreType;

export const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
  }
})

export const { } = userSlice.actions

export default userSlice.reducer
