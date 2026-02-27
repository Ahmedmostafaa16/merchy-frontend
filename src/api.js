import { getShopifyParams } from "./shopify";

export async function shopifyFetch(path, options = {}) {
  const { host } = getShopifyParams();

  if (!host) {
    throw new Error("Not running inside Shopify");
  }

  const token = await window.shopify.sessionToken();

  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend error ${response.status}: ${text}`);
  }

  return response.json();
}
