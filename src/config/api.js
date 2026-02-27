const API_BASE = process.env.REACT_APP_API_BASE_URL;

if (!API_BASE) {
  throw new Error("Missing REACT_APP_API_BASE_URL");
}

export { API_BASE };
