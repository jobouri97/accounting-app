import api from "./client";

export const getTransactions = (page = 1, customerId = null) =>
  api.get("/transactions", {
    params: {
      page,
      ...(customerId ? { customer_id: customerId } : {}),
    },
  });

export const createTransaction = (transaction) =>
  api.post("/transactions", transaction);

export const updateTransaction = (id, transaction) =>
  api.put(`/transactions/${id}`, transaction);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`);
