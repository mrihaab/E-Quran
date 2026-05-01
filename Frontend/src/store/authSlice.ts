import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../types';
import { removeTokens } from '../api';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      removeTokens();
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setApprovalStatus: (state, action: PayloadAction<User['approvalStatus']>) => {
      if (state.user) {
        state.user.approvalStatus = action.payload;
      }
    },
  },
});

export const { login, logout, updateUser, setApprovalStatus } = authSlice.actions;
export default authSlice.reducer;
