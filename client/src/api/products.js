import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/products",
});

export const getProducts = (page = 1) =>
  api.get("/", {
    params: { page },
  });
  
export const getProduct = (id) => api.get(`/${id}`);

export const createProduct = (product) => api.post("/", product);

export const updateProduct = (id, product) =>
  api.put(`/${id}`, product);

export const deleteProduct = (id) =>
  api.delete(`/${id}`);