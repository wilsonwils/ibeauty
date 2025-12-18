export const permissionService = {
  getAllowedModules() {
    const modules = JSON.parse(
      localStorage.getItem("accessModules") || "[]"
    );
	console.log('modules',modules);
    return modules.map((m) => m.id);
  },
	
  /** Check if user has ANY of the given modules */
  hasAny(moduleIds = []) {
    const allowed = this.getAllowedModules();
    return moduleIds.some((id) => allowed.includes(id));
  },

  /** Check if user has ALL of the given modules */
  hasAll(moduleIds = []) {
    const allowed = this.getAllowedModules();
    return moduleIds.every((id) => allowed.includes(id));
  },

  /** Check single module */
  has(moduleId) {
    return this.getAllowedModules().includes(moduleId);
  },
};
