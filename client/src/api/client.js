import axios from "axios";

const serverUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000")
  .replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${serverUrl}/api`,
  withCredentials: true,
});

export default api;
