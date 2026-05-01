import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../types';
import { apiLogout, removeTokens } from '../api';

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await apiLogout();
});

// redux-persist (in store.ts) handles state persistence automatically.
// No manual localStorage needed here.
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
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
    builder.addCase(logoutUser.rejected, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      removeTokens();
    });
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;