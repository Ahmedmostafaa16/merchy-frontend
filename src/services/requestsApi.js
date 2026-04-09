import { apiClient } from "../lib/apiClient";

export const syncInventory = async (shopDomain) => {
  return apiClient.post("/requests/sync/inventory", {
    query: {
      shop: shopDomain,
    },
  });
};

export const syncSales = async (shopDomain, startDate, endDate) => {
  return apiClient.post("/requests/sync/sales", {
    query: {
      shop: shopDomain,
      start_date: startDate,
      end_date: endDate,
    },
  });
};

export const searchInventory = async (shopDomain, searchQuery) => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  return apiClient.get("/requests/inventory/search", {
    query: {
      shop: shopDomain,
      search_query: searchQuery.trim(),
    },
  });
};
