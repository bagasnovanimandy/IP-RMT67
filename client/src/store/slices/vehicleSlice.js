import { createSlice } from "@reduxjs/toolkit";

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState: {
    vehicles: [],
    currentVehicle: null,
    filters: {
      q: "",
      city: "ALL",
      min: "",
      max: "",
      sort: "createdAt",
      order: "DESC",
    },
    pagination: {
      page: 1,
      limit: 9,
      total: 0,
      totalPages: 1,
    },
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
    setVehicles: (state, action) => {
      state.vehicles = action.payload.data || [];
      if (action.payload.meta) {
        state.pagination = {
          ...state.pagination,
          ...action.payload.meta,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setCurrentVehicle: (state, action) => {
      state.currentVehicle = action.payload;
      state.loading = false;
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset to page 1 when filters change
      state.pagination.page = 1;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearVehicles: (state) => {
      state.vehicles = [];
      state.currentVehicle = null;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setVehicles,
  setCurrentVehicle,
  setFilters,
  setPagination,
  clearVehicles,
} = vehicleSlice.actions;
export default vehicleSlice.reducer;

