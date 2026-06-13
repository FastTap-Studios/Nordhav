export const ADMIN_EMAILS = ["chia.jamal93@gmail.com"];

/** @deprecated use staffService.isStaffEmail – kept for bootstrap fallback */
export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.trim().toLowerCase());
};
