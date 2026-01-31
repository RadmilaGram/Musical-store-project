import { apiClient } from "./axiosInstance";

export async function getAdminUsers() {
  const { data } = await apiClient.get("/api/admin/users", {
    withCredentials: true,
  });
  return data;
}

export async function updateAdminUserRole(userId, role) {
  if (!userId) {
    return null;
  }
  const { data } = await apiClient.patch(
    `/api/admin/users/${userId}/role`,
    { role },
    { withCredentials: true }
  );
  return data;
}

export async function updateAdminUserActive(userId, isActive) {
  if (!userId) {
    return null;
  }
  const { data } = await apiClient.patch(
    `/api/admin/users/${userId}/active`,
    { is_active: Boolean(isActive) },
    { withCredentials: true }
  );
  return data;
}

export async function createStaffUser(payload) {
  const { data } = await apiClient.post("/api/admin/users", payload, {
    withCredentials: true,
  });
  return data;
}
