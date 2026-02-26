import createApp from "@shopify/app-bridge";

export function initShopifyApp() {
  const params = new URLSearchParams(window.location.search);

  const shop = params.get("shop");
  const host = params.get("host");

  if (!shop || !host) {
    console.error("Missing shop or host in URL");
    return null;
  }

  return createApp({
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
    host,
    forceRedirect: true,
  });
}
