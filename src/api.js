// src/api.js

export async function shopifyFetch(path, options = {}) {
  // Shopify injects the global `window.shopify` object in embedded apps
  const shopify = window.shopify;

  if (!shopify) {
    throw new Error("Shopify App Bridge not available on window");
  }

  // Request a session token from Shopify
  const token = await shopify.sessionToken();

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
    throw new Error(`Backend request failed (${response.status}): ${text}`);
  }

  return response.json();
}