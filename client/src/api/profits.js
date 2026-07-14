import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/profits",
});

export const getProfits = (page = 1, startDate = "", endDate = "") =>
  api.get("/", {
    params: {
      page,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
  });
