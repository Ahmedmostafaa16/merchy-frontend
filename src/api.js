// src/api.js

export async function shopifyFetch(path, options = {}) {
  const shopify = window.shopify;

  if (!shopify) {
    throw new Error("Shopify App Bridge not ready");
  }

  const token = await shopify.sessionToken();

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
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}