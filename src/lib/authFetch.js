import { getSessionToken } from "@shopify/app-bridge";
import { getAppBridge } from "./shopify";

const getApiBase = () => process.env.REACT_APP_BACKEND_URL;

export async function authFetch(path, options = {}) {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new Error("Missing REACT_APP_BACKEND_URL");
  }

  const app = getAppBridge();
  if (!app) {
    throw new Error("Shopify App Bridge is not initialized");
  }

  const token = await getSessionToken(app);

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.error || payload?.detail || "Request failed";
    throw new Error(detail);
  }

  return payload;
}
