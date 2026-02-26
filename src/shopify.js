import createApp from "@shopify/app-bridge";

export function initShopifyApp() {
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host");

  if (!host) {
    console.error("Missing host param");
    return null;
  }

  return createApp({
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
    host,
    forceRedirect: true,
  });
}
