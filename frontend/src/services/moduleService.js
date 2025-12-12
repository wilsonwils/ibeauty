import { api } from "../utils/api";

export const getModules = async () => {
  const response = await api("/modules", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch modules");
  }

  return response.json();
};
