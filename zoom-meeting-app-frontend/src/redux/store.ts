// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// ** Reducers
import userReducer from './features/userSlice'
import meetingReducer from './features/meetingSlice'
import { userApi } from './services/user'
import { meetingApi } from './services/meeting'

export const store = configureStore({
    reducer: {
        [userApi.reducerPath]: userApi.reducer,
        [meetingApi.reducerPath]: meetingApi.reducer,
        user: userReducer,
        meeting: meetingReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        }).concat(
            userApi.middleware,
            meetingApi.middleware,
        ),
    devTools: process.env.NODE_ENV === 'development' ? true : false,
})
setupListeners(store.dispatch)
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>