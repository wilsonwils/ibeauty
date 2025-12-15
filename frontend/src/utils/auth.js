// utils/auth.js

// Decode JWT without verifying signature (frontend-only)
export const getTokenPayload = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
};

// Check if token is expired
export const isTokenValid = (token) => {
  const payload = getTokenPayload(token);
  if (!payload || !payload.exp) return false;

  const now = Date.now() / 1000; // current time in seconds
  return payload.exp > now;
};
