import { getSessionToken } from "@shopify/app-bridge-utils";
import { initShopifyApp } from "./shopify";

export async function shopifyFetch(path, options = {}) {
  const app = initShopifyApp();
  if (!app) throw new Error("Shopify not initialized");

  const token = await getSessionToken(app);

  const res = await fetch(
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

  if (!res.ok) {
    throw new Error("API request failed");
  }

  return res.json();
}
