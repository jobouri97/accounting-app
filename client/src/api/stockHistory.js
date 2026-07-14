import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/stock-history",
  withCredentials: true,
});

export const getStockHistory = (
  page = 1,
  productId = null
) =>
  api.get("/", {
    params: {
      page,
      ...(productId ? { product_id: productId } : {}),
    },
  });

export const getStockHistoryRecord = (id) =>
  api.get(`/${id}`);

export const createStockHistory = (stockData) =>
  api.post("/", stockData);

export const updateStockHistory = (id, stockData) =>
  api.put(`/${id}`, stockData);

export const deleteStockHistory = (id) =>
  api.delete(`/${id}`);
