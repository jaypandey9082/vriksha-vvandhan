export type StaffRole = "admin" | "reviewer";

export type StaffSession = {
  userId: string;
  email: string | null;
  displayName: string;
  role: StaffRole;
};
