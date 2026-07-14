import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/customers",
  withCredentials: true,
});

export const getCustomers = (page = 1, search = "") =>
  api.get("/", { params: { page, search } });

export const createCustomer = (customer) => api.post("/", customer);

export const updateCustomer = (id, customer) =>
  api.put(`/${id}`, customer);

export const deleteCustomer = (id) => api.delete(`/${id}`);
