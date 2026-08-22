import { configureStore } from '@reduxjs/toolkit';
import permissionReducer from './permission/permissionSlice';
import userReducer from './user/user';

const store = configureStore({
  reducer: {
    user : userReducer,
    permission: permissionReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;