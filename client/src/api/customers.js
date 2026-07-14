import api from "./client";

export const getCustomers = (page = 1, search = "") =>
  api.get("/customers", { params: { page, search } });

export const createCustomer = (customer) => api.post("/customers", customer);

export const updateCustomer = (id, customer) =>
  api.put(`/customers/${id}`, customer);

export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
