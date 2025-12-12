export const API_BASE = import.meta.env.VITE_API_URL;

export const api = (endpoint, options = {}) => {
  const token = localStorage.getItem("AUTH_TOKEN"); 

  return fetch(`${API_BASE}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",  // 🔥 REQUIRED for CORS + auth
    
    ...options,
  });
};
