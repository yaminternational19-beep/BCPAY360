export const canAccessDepartment = (user, department) => {
  if (!user) return false;

  if (user.role === "COMPANY_ADMIN") return true;

  if (user.role === "HR") {
    return user.department === department;
  }

  return false;
};
