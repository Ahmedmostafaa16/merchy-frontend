import { apiClient } from "../lib/apiClient";

export const syncInventory = async () => {
  return apiClient.post("/requests/sync/inventory");
};

export const syncSales = async (startDate, endDate) => {
  return apiClient.post("/requests/sync/sales", {
    query: {
      start_date: startDate,
      end_date: endDate,
    },
  });
};

export const searchInventory = async (searchQuery) => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  return apiClient.get("/requests/inventory/search", {
    query: {
      search_query: searchQuery.trim(),
    },
  });
};
