export function getShopifyParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    shop: params.get("shop"),
    host: params.get("host"),
  };
}
