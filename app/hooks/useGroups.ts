"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { get, onValue, push, ref, set, update } from "firebase/database";
import { database } from "@/app/firebase";

export interface GroupSummary {
  id: string;
  name: string;
  role: "owner" | "member";
}

export function useGroups(user: User | null) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setActiveGroupId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userGroupsRef = ref(database, `userGroups/${user.uid}`);
    const unsubscribe = onValue(userGroupsRef, (snapshot) => {
      const rawGroups = snapshot.val() ?? {};
      const nextGroups = Object.entries(rawGroups).map(([id, value]) => {
        const group = value as Omit<GroupSummary, "id">;
        return {
          id,
          name: group.name,
          role: group.role,
        };
      });

      setGroups(nextGroups);
      setActiveGroupId((currentGroupId) => {
        if (currentGroupId && nextGroups.some((group) => group.id === currentGroupId)) {
          return currentGroupId;
        }

        return nextGroups[0]?.id ?? null;
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? null,
    [activeGroupId, groups]
  );

  const createGroup = useCallback(async (name: string) => {
    if (!user) {
      throw new Error("Necesitas iniciar sesion para crear un grupo.");
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("El grupo necesita un nombre.");
    }

    const newGroupRef = push(ref(database, "groups"));
    const groupId = newGroupRef.key;

    if (!groupId) {
      throw new Error("No se pudo crear el grupo.");
    }

    const now = Date.now();
    await update(ref(database), {
      [`groups/${groupId}`]: {
        name: trimmedName,
        ownerId: user.uid,
        createdAt: now,
        members: {
          [user.uid]: {
            email: user.email,
            role: "owner",
            joinedAt: now,
          },
        },
      },
      [`userGroups/${user.uid}/${groupId}`]: {
        name: trimmedName,
        role: "owner",
      },
    });

    setActiveGroupId(groupId);
    return groupId;
  }, [user]);

  const joinGroup = useCallback(async (groupId: string) => {
    if (!user) {
      throw new Error("Inicia sesion para unirte al grupo.");
    }

    const trimmedGroupId = groupId.trim();
    const groupSnapshot = await get(ref(database, `groups/${trimmedGroupId}`));
    const group = groupSnapshot.val();

    if (!group) {
      throw new Error("El enlace de invitacion no pertenece a ningun grupo.");
    }

    const now = Date.now();
    await update(ref(database), {
      [`groups/${trimmedGroupId}/members/${user.uid}`]: {
        email: user.email,
        role: "member",
        joinedAt: now,
      },
      [`userGroups/${user.uid}/${trimmedGroupId}`]: {
        name: group.name,
        role: "member",
      },
    });

    setActiveGroupId(trimmedGroupId);
  }, [user]);

  const renameActiveGroup = useCallback(async (name: string) => {
    if (!user || !activeGroup) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("El grupo necesita un nombre.");
    }

    await set(ref(database, `groups/${activeGroup.id}/name`), trimmedName);

    const groupSnapshot = await get(ref(database, `groups/${activeGroup.id}/members`));
    const members = groupSnapshot.val() ?? {};
    const updates = Object.keys(members).reduce<Record<string, string>>((acc, uid) => {
      acc[`userGroups/${uid}/${activeGroup.id}/name`] = trimmedName;
      return acc;
    }, {});

    await update(ref(database), updates);
  }, [activeGroup, user]);

  return {
    groups,
    activeGroup,
    activeGroupId,
    loading,
    setActiveGroupId,
    createGroup,
    joinGroup,
    renameActiveGroup,
  };
}
