import { PLAN_SIGNATURES } from "../config/module";

export const permissionService = {
  // ---------- GET ALLOWED MODULES ----------
  getAllowedModules() {
    if (this.isAdmin()) {
      return [1, 2, 4, 5]; 
    }

    let modules = localStorage.getItem("accessModules");

    try {
      modules = modules ? JSON.parse(modules) : [];
    } catch (e) {
      console.warn("Invalid accessModules in localStorage, resetting to []");
      modules = [];
    }

    if (!Array.isArray(modules)) return [];

    return modules
      .map((m) => {
        if (typeof m === "number") return m;
        if (m && typeof m.id === "number") return m.id;
        return null;
      })
      .filter(Boolean); // remove nulls
  },

  // ---------- CHECK MODULES ----------
  hasAny(moduleIds = []) {
    const allowed = this.getAllowedModules();
    return moduleIds.some((id) => allowed.includes(id));
  },

  hasAll(moduleIds = []) {
    const allowed = this.getAllowedModules();
    return moduleIds.every((id) => allowed.includes(id));
  },

  has(moduleId) {
    return this.getAllowedModules().includes(moduleId);
  },

  isAdmin() {
    const role = localStorage.getItem("role");
    return role === "admin";
  },

  // ---------- SET ALLOWED MODULES ----------
  setAllowedModules(plan, customModules = []) {
    const defaultModules = PLAN_SIGNATURES[plan] || [];
    const mergedModules = [...new Set([...defaultModules, ...customModules])];
    localStorage.setItem("accessModules", JSON.stringify(mergedModules));
    return mergedModules;
  },
};
