import { getShopifyParams } from "./shopify";
import { fetchWithToken } from "./lib/authFetch";

export async function shopifyFetch(path, options = {}) {
  const { host } = getShopifyParams();

  if (!host) {
    throw new Error("Not running inside Shopify");
  }

  const response = await fetchWithToken(`${process.env.REACT_APP_BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend error ${response.status}: ${text}`);
  }

  return response.json();
}
