import axios from "axios";

export const serverApi = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

//! Tempel token kalau ada
serverApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("gcr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
