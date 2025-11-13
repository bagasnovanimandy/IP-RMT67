// Initialize auth state from localStorage after store is created
// This should be called after store is created to avoid circular dependencies

import { loginSuccess } from "./slices/authSlice";

export function initAuthFromStorage(store) {
  if (typeof window === "undefined") return;
  
  try {
    const token = localStorage.getItem("gcr_token");
    const userStr = localStorage.getItem("gcr_user");
    
    if (token) {
      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.warn("Failed to parse user from localStorage");
          localStorage.removeItem("gcr_user");
        }
      }
      
      // Dispatch to update store with saved auth state
      store.dispatch(loginSuccess({ token, user }));
    }
  } catch (error) {
    console.error("Error loading initial auth state:", error);
  }
}

