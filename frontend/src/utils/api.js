// src/utils/api.js
export const API_BASE = import.meta.env.VITE_API_URL;

export const api = (endpoint, options = {}) => {
  return fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
};
