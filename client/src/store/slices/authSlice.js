import { createSlice } from "@reduxjs/toolkit";

// Safe initial state - will be hydrated from localStorage after store creation
const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Persist to localStorage (only in browser)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("gcr_token", token);
          localStorage.setItem("gjt_token", token);
          if (user) {
            localStorage.setItem("gcr_user", JSON.stringify(user));
          }
        } catch (error) {
          console.error("Failed to save to localStorage:", error);
        }
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      // Clear localStorage (only in browser)
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("gcr_token");
          localStorage.removeItem("gjt_token");
          localStorage.removeItem("gcr_user");
        } catch (error) {
          console.error("Failed to clear localStorage:", error);
        }
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (state.user && typeof window !== "undefined") {
        try {
          localStorage.setItem("gcr_user", JSON.stringify(state.user));
        } catch (error) {
          console.error("Failed to update user in localStorage:", error);
        }
      }
    },
  },
});

export const { setLoading, setError, loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

