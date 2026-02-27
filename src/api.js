import { getSessionToken } from "@shopify/app-bridge-utils";
import createApp from "@shopify/app-bridge";

export async function shopifyFetch(path) {
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host");

  const app = createApp({
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
    host,
    forceRedirect: true,
  });

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

  return res.json();
}