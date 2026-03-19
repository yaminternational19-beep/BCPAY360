export const getAuthUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("auth_user"));
    const token = localStorage.getItem("token");

    if (!user || !token) return null;
    if (!user.verified) return null;

    if (!["COMPANY_ADMIN", "HR"].includes(user.role)) {
      return null;
    }

    return { user, token };
  } catch {
    return null;
  }
};
