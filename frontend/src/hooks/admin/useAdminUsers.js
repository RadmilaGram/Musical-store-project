import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminUsers,
  updateAdminUserActive,
  updateAdminUserRole,
} from "../../api/adminUsers.api";
import { useAuth } from "../useAuth";

const ROLE_OPTIONS = [
  { id: 1, label: "Admin" },
  { id: 3, label: "Manager" },
  { id: 4, label: "Courier" },
];

export function useAdminUsers() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [activeDrafts, setActiveDrafts] = useState({});

  const roleOptions = useMemo(() => ROLE_OPTIONS, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      const items = Array.isArray(data?.items) ? data.items : [];
      setUsers(items);
      setRoleDrafts((prev) => {
        const next = { ...prev };
        items.forEach((item) => {
          next[item.id] = item.role;
        });
        return next;
      });
      setActiveDrafts((prev) => {
        const next = { ...prev };
        items.forEach((item) => {
          next[item.id] = Boolean(item.is_active);
        });
        return next;
      });
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers().catch(() => {});
  }, [loadUsers]);

  const setRoleDraft = useCallback((userId, role) => {
    setRoleDrafts((prev) => ({ ...prev, [userId]: role }));
  }, []);

  const setActiveDraft = useCallback((userId, isActive) => {
    setActiveDrafts((prev) => ({ ...prev, [userId]: Boolean(isActive) }));
  }, []);

  const saveChanges = useCallback(
    async (userId) => {
      if (!userId || savingId) {
        return null;
      }
      const role = roleDrafts[userId];
      const nextActive = activeDrafts[userId];
      const user = users.find((item) => item.id === userId);
      if (!user) {
        return null;
      }
      const roleChanged =
        role !== undefined && Number(role) !== Number(user.role);
      const activeChanged =
        nextActive !== undefined && Boolean(user.is_active) !== Boolean(nextActive);
      if (!roleChanged && !activeChanged) {
        return null;
      }

      setSavingId(userId);
      setSaveError(null);
      try {
        let updatedUser = user;
        if (roleChanged) {
          const roleResponse = await updateAdminUserRole(userId, role);
          if (roleResponse?.user) {
            updatedUser = roleResponse.user;
          }
        }
        if (activeChanged) {
          const activeResponse = await updateAdminUserActive(userId, nextActive);
          if (activeResponse?.user) {
            updatedUser = activeResponse.user;
          }
        }

        setUsers((prev) =>
          prev.map((item) => (item.id === userId ? updatedUser : item))
        );
        setRoleDrafts((prev) => ({ ...prev, [userId]: updatedUser.role }));
        setActiveDrafts((prev) => ({
          ...prev,
          [userId]: Boolean(updatedUser.is_active),
        }));
        return updatedUser;
      } catch (err) {
        setSaveError(err);
        throw err;
      } finally {
        setSavingId(null);
      }
    },
    [activeDrafts, roleDrafts, savingId, users]
  );

  return {
    users,
    loading,
    error,
    roleOptions,
    roleDrafts,
    activeDrafts,
    currentUserId,
    savingId,
    saveError,
    loadUsers,
    setRoleDraft,
    setActiveDraft,
    saveChanges,
  };
}

export default useAdminUsers;
