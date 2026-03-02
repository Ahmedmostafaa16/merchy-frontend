import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge-utils";

export async function getToken() {
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host");

  const app = createApp({
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
    host,
  });

  return await getSessionToken(app);
}
