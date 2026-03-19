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

  const perm = permissions.find(
    (p) => p.module_key === moduleKey
  );

  if (!perm) return false;

  switch (action) {
    case "view":
      return !!perm.can_view;
    case "create":
      return !!perm.can_create;
    case "edit":
      return !!perm.can_edit;
    case "delete":
      return !!perm.can_delete;
    case "approve":
      return !!perm.can_approve;
    default:
      return false;
  }
};
