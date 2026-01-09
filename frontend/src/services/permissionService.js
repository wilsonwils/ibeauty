export const permissionService = {
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

    // Ensure it is an array of IDs
    return Array.isArray(modules) ? modules.map((m) => m.id) : [];
  },

  /**
   * Check if the user has ANY of the given module IDs
   * @param {number[]} moduleIds
   * @returns {boolean}
   */
  hasAny(moduleIds = []) {
    const allowed = this.getAllowedModules();
    return moduleIds.some((id) => allowed.includes(id));
  },

  /**
   * Check if the user has ALL of the given module IDs
   * @param {number[]} moduleIds
   * @returns {boolean}
   */
  hasAll(moduleIds = []) {
    const allowed = this.getAllowedModules();
    return moduleIds.every((id) => allowed.includes(id));
  },

  /**
   * Check if the user has a single module
   * @param {number} moduleId
   * @returns {boolean}
   */
  has(moduleId) {
    return this.getAllowedModules().includes(moduleId);
  },

  /**
   * Check if the user is an admin
   * Assumes the user role is stored in localStorage as "role"
   * @returns {boolean}
   */
  isAdmin() {
    const role = localStorage.getItem("role"); // should be "admin" for admins
    return role === "admin";
  },
};
