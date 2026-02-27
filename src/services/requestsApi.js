import { apiClient } from "../lib/apiClient";

export const syncInventory = async (shopDomain) => {
  return apiClient.post(`/requests/sync/inventory/${encodeURIComponent(shopDomain)}`);
};

export const syncSales = async (shopDomain, startDate, endDate) => {
  return apiClient.post(`/requests/sync/sales/${encodeURIComponent(shopDomain)}`, {
    query: {
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
      shop_domain: shopDomain,
      search_query: searchQuery.trim(),
    },
  });
};
