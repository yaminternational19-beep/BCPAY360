/* ============================
   PERMISSION HELPERS
============================ */

/**
 * HR can edit only employees from same department
 * Company admin can edit all
 */
export const canEditEmployee = (user, employee) => {
  if (!user) return false;

  if (user.role === "COMPANY_ADMIN") return true;

  if (user.role === "HR") {
    return employee.department_id === user.department_id;
  }

  return false;
};

/**
 * Generic module permission checker
 */
export const hasPermission = (permissions, moduleKey, action = "view") => {
  if (!Array.isArray(permissions)) return false;

  // Simple string-based permission (Existence in list means allowed)
  return permissions.includes(moduleKey);
};
