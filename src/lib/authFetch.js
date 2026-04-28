import { getFreshSessionToken } from "../shopify/getToken";
import { getHostParam } from "../shopify/appBridge";

const getApiBase = () => process.env.REACT_APP_BACKEND_URL;

export const fetchWithToken = async (url, options = {}) => {
  const token = await getFreshSessionToken();
  const host = getHostParam();
  if (!token) {
    throw new Error("Shopify session token missing");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(host ? { "X-Shopify-Host": host } : {}),
    },
  });
};

export async function authFetch(path, options = {}) {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new Error("Missing REACT_APP_BACKEND_URL");
  }

  return fetchWithToken(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
