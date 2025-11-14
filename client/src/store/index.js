import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import vehicleReducer from "./slices/vehicleSlice";
import bookingReducer from "./slices/bookingSlice";

let store;

try {
  store = configureStore({
    reducer: {
      auth: authReducer,
      vehicle: vehicleReducer,
      booking: bookingReducer,
    },
  });
  console.log("✅ Redux store configured successfully");
} catch (error) {
  console.error("❌ Failed to configure Redux store:", error);
  // Create a minimal store as fallback
  store = configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, user: null, loading: false, error: null }, action) => state,
      vehicle: (state = { vehicles: [], loading: false, error: null }, action) => state,
      booking: (state = { bookings: [], loading: false, error: null }, action) => state,
    },
  });
}

export { store };

// TypeScript types (uncomment if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

