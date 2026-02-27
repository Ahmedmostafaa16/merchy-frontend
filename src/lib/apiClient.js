import { API_BASE } from "../config/api";

class ApiClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.data = options.data;
    this.isNetwork = Boolean(options.isNetwork);
    this.isConfig = Boolean(options.isConfig);
  }
}

const getApiBase = () => API_BASE;

const getSessionToken = async () => {
  if (typeof window === "undefined" || typeof window.shopify?.sessionToken !== "function") {
    throw new ApiClientError("Shopify session token is unavailable.", { isConfig: true });
  }

  return window.shopify.sessionToken();
};

const parseResponseBody = async (response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  try {
    return await response.text();
  } catch (_error) {
    return null;
  }
};

const toQueryString = (query) => {
  if (!query) return "";

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const request = async (method, path, options = {}) => {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiClientError("Missing API base URL configuration.", { isConfig: true });
  }

  const token = await getSessionToken();

  const queryString = toQueryString(options.query);
  const url = `${apiBase}${path}${queryString}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true",
    ...(options.headers || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: hasBody
        ? options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      const detail = typeof data === "object" && data ? data.detail || data.message : null;
      throw new ApiClientError(detail || `Request failed with status ${response.status}`, {
        status: response.status,
        data,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError(error?.message || "Network request failed.", {
      isNetwork: true,
    });
  }
};

export const apiClient = {
  get: (path, options = {}) => request("GET", path, options),
  post: (path, options = {}) => request("POST", path, options),
  put: (path, options = {}) => request("PUT", path, options),
  delete: (path, options = {}) => request("DELETE", path, options),
};

export { ApiClientError, getApiBase };
