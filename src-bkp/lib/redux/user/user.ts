//creating redsux for user data
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';
interface UserState {
  user: User | null;
  isAdmin: boolean; // Added to track if the user is an admin
}
const initialState: UserState = {
  user: null,
  isAdmin: false, // Default to false, will be updated based on user data
};
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    //action to set user data
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAdmin = action.payload?.roles?.includes('Admin') || action.payload?.roles?.includes('Admin_user') || false; // Check if user has Admin role
    },
  }
});
export const { setUser } = userSlice.actions;
export default userSlice.reducer;
