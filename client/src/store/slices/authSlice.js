import { createSlice } from "@reduxjs/toolkit";

// Load initial state from localStorage
const getInitialState = () => {
  try {
    const token = localStorage.getItem("gcr_token");
    const userStr = localStorage.getItem("gcr_user");
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      token: token || null,
      user: user,
      isAuthenticated: !!token,
      loading: false,
      error: null,
    };
  } catch (error) {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
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
      
      // Persist to localStorage
      localStorage.setItem("gcr_token", token);
      localStorage.setItem("gjt_token", token);
      if (user) {
        localStorage.setItem("gcr_user", JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem("gcr_token");
      localStorage.removeItem("gjt_token");
      localStorage.removeItem("gcr_user");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (state.user) {
        localStorage.setItem("gcr_user", JSON.stringify(state.user));
      }
    },
  },
});

export const { setLoading, setError, loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

