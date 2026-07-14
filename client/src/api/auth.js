import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/auth",
  withCredentials: true,
});

export const registerAccount = (account) => api.post("/register", account);
export const loginAccount = (credentials) => api.post("/login", credentials);
export const logoutAccount = () => api.post("/logout");
export const getCurrentAccount = () => api.get("/me");
