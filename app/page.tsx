"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LosSantos from "@/components/los-santos";
import SanFierro from "@/components/san-fierro";
import LasVenturas from "@/components/las-venturas";
import AuthPanel from "@/components/auth-panel";
import GroupToolbar from "@/components/group-toolbar";
import { useAuth } from "@/app/hooks/useAuth";
import { useGroups } from "@/app/hooks/useGroups";

export default function CitiesApp() {
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const {
    groups,
    activeGroup,
    activeGroupId,
    loading: groupsLoading,
    setActiveGroupId,
    createGroup,
    joinGroup,
  } = useGroups(user);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const inviteGroupId = params.get("invite");

    if (!inviteGroupId) {
      return;
    }

    joinGroup(inviteGroupId)
      .then(() => {
        setInviteMessage("Te has unido al grupo de la invitacion.");
        params.delete("invite");
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
        window.history.replaceState(null, "", nextUrl);
      })
      .catch((error) => {
        setInviteMessage(
          error instanceof Error ? error.message : "No se pudo aceptar la invitacion."
        );
      });
  }, [joinGroup, user]);

  if (authLoading) {
    return <main className="p-4 text-center text-muted-foreground">Cargando...</main>;
  }

  if (!user) {
    return <AuthPanel onLogin={login} onRegister={register} />;
  }

  return (
    <div className="container mx-auto p-4">
      <GroupToolbar
        userEmail={user.email}
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={setActiveGroupId}
        onCreateGroup={createGroup}
        onLogout={logout}
      />
      {inviteMessage ? (
        <p className="mb-4 rounded-md border border-border bg-card p-3 text-sm">
          {inviteMessage}
        </p>
      ) : null}
      {groupsLoading ? (
        <p className="text-center text-muted-foreground">Cargando grupos...</p>
      ) : null}
      {!groupsLoading && !activeGroupId ? (
        <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Crea un grupo para empezar a guardar tiempos compartidos.
        </p>
      ) : null}
      {activeGroupId ? (
      <Tabs defaultValue="los-santos">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="los-santos">Los Santos</TabsTrigger>
          <TabsTrigger value="san-fierro">San Fierro</TabsTrigger>
          <TabsTrigger value="las-venturas">Las Venturas</TabsTrigger>
        </TabsList>
        <TabsContent value="los-santos">
          <LosSantos groupId={activeGroupId} />
        </TabsContent>
        <TabsContent value="san-fierro">
          <SanFierro groupId={activeGroupId} />
        </TabsContent>
        <TabsContent value="las-venturas">
          <LasVenturas groupId={activeGroupId} />
        </TabsContent>
      </Tabs>
      ) : null}
    </div>
  );
}
