/**
 * Normalize employee profile photo
 * Use this everywhere in frontend
 */
export const resolveProfileAvatar = (employee) => {
  if (employee?.profile_photo_url) {
    return {
      type: "image",
      value: employee.profile_photo_url
    };
  }

  const initials = employee?.full_name
    ? employee.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("")
    : "👤";

  return {
    type: "initials",
    value: initials
  };
};
