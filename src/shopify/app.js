import createApp from "@shopify/app-bridge";

export function getShopifyApp() {
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host");

  return createApp({
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
    host,
    forceRedirect: true,
  });
}
