import { getFreshSessionToken } from "../shopify/getToken";

const getApiBase = () => process.env.REACT_APP_BACKEND_URL;

export const fetchWithToken = async (url, options = {}) => {
  const token = await getFreshSessionToken();
  if (!token) {
    throw new Error("Shopify session token missing");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
