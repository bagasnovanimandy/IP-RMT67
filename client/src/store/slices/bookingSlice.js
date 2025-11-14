import { createSlice } from "@reduxjs/toolkit";

const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setBookings: (state, action) => {
      state.bookings = action.payload;
      state.loading = false;
      state.error = null;
    },
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload);
    },
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(
        (b) => b.id === action.payload.id
      );
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    },
    removeBooking: (state, action) => {
      state.bookings = state.bookings.filter(
        (b) => b.id !== action.payload
      );
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearBookings: (state) => {
      state.bookings = [];
      state.currentBooking = null;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setBookings,
  addBooking,
  updateBooking,
  removeBooking,
  setCurrentBooking,
  clearBookings,
} = bookingSlice.actions;
export default bookingSlice.reducer;

