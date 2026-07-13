import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/transactions",
});

export const getTransactions = (page = 1, customerId = null) =>
  api.get("/", {
    params: {
      page,
      ...(customerId ? { customer_id: customerId } : {}),
    },
  });

export const createTransaction = (transaction) =>
  api.post("/", transaction);
