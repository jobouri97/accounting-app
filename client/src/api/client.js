import axios from "axios";

const configuredServerUrl = import.meta.env.VITE_API_URL?.trim();
const defaultServerUrl = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:3000";
const serverUrl = (configuredServerUrl || defaultServerUrl).replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${serverUrl}/api`,
  withCredentials: true,
});

export default api;
