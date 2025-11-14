import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const serverApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

serverApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("gjt_token") || localStorage.getItem("gcr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

serverApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message || err?.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);
