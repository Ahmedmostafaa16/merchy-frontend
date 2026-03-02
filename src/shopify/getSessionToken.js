import { getSessionToken } from "@shopify/app-bridge-utils";
import { getShopifyApp } from "./app";

export async function getToken() {
  const app = getShopifyApp();

  return await getSessionToken(app);
}
