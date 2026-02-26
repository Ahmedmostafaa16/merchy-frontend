import { getSessionToken } from "@shopify/app-bridge-utils";
import { initShopifyApp } from "./shopify";

export async function shopifyFetch(path) {
  const app = initShopifyApp();
  if (!app) throw new Error("App Bridge failed to initialize");

  const token = await getSessionToken(app);

  const res = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Backend request failed: ${res.status}`);
  }

  return res.json();
}
