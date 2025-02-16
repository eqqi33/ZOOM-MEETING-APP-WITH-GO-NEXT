// ** Redux Imports
import { createSlice } from '@reduxjs/toolkit'
// ** Types
import { MeetingStoreType } from '@/types/servicesTypes';

const initialState = {
  meeting: null,
} as MeetingStoreType;

export const meetingSlice = createSlice({
  name: 'meeting',
  initialState: initialState,
  reducers: {
  }
})

export const { } = meetingSlice.actions

export default meetingSlice.reducer
