import api from "./client";

export const getProfits = (page = 1, startDate = "", endDate = "") =>
  api.get("/profits", {
    params: {
      page,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
  });
