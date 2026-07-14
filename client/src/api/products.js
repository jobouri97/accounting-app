import api from "./client";

export const getProducts = (page = 1, search = "") =>
  api.get("/products", {
    params: {
      page,
      search,
    },
  });
export const getProduct = (id) => api.get(`/products/${id}`);

export const createProduct = (product) => api.post("/products", product);

export const updateProduct = (id, product) =>
  api.put(`/products/${id}`, product);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`);
