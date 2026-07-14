import api from "./client";

export const registerAccount = (account) => api.post("/auth/register", account);
export const loginAccount = (credentials) => api.post("/auth/login", credentials);
export const loginWithGoogle = (credential) => api.post("/auth/google", { credential });
export const logoutAccount = () => api.post("/auth/logout");
export const getCurrentAccount = () => api.get("/auth/me");
