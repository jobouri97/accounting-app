import api from "./client";

export const getStockHistory = (
  page = 1,
  productId = null
) =>
  api.get("/stock-history", {
    params: {
      page,
      ...(productId ? { product_id: productId } : {}),
    },
  });

export const getStockHistoryRecord = (id) =>
  api.get(`/stock-history/${id}`);

export const createStockHistory = (stockData) =>
  api.post("/stock-history", stockData);

export const updateStockHistory = (id, stockData) =>
  api.put(`/stock-history/${id}`, stockData);

export const deleteStockHistory = (id) =>
  api.delete(`/stock-history/${id}`);
