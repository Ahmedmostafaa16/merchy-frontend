import { API_BASE } from "../config/api";

const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
};

const parseErrorResponse = async (response) => {
  try {
    const data = await response.json();
    if (data?.detail) {
      return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
    return data?.message || `Request failed (${response.status})`;
  } catch (_error) {
    return `Request failed (${response.status})`;
  }
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...NGROK_HEADERS,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const syncInventory = async (shopDomain) => {
  return requestJson(
    `${API_BASE}/requests/sync/inventory/${encodeURIComponent(shopDomain)}`,
    { method: "POST" }
  );
};

export const syncSales = async (shopDomain, startDate, endDate) => {
  const query = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  }).toString();

  return requestJson(
    `${API_BASE}/requests/sync/sales/${encodeURIComponent(shopDomain)}?${query}`,
    { method: "POST" }
  );
};

export const searchInventory = async (shopDomain, searchQuery) => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  const query = new URLSearchParams({
    shop_domain: shopDomain,
    search_query: searchQuery.trim(),
  }).toString();

  return requestJson(`${API_BASE}/requests/inventory/search?${query}`);
};
