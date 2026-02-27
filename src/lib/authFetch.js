import { getFreshSessionToken } from "../shopify/getToken";

const getApiBase = () => process.env.REACT_APP_BACKEND_URL;

export const fetchWithToken = async (url, options = {}) => {
  const token = await getFreshSessionToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
};

export async function authFetch(path, options = {}) {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new Error("Missing REACT_APP_BACKEND_URL");
  }

  const response = await fetchWithToken(`${apiBase}${path}`, {
    ...options,
    headers: {
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
