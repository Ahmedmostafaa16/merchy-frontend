const API_BASE = process.env.REACT_APP_BACKEND_URL;

if (!API_BASE) {
  throw new Error("Missing REACT_APP_BACKEND_URL");
}

export { API_BASE };
