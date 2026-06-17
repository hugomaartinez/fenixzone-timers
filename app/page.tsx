"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LosSantos from "@/components/los-santos";
import SanFierro from "@/components/san-fierro";
import LasVenturas from "@/components/las-venturas";
import AuthPanel from "@/components/auth-panel";
import GroupToolbar from "@/components/group-toolbar";
import Transportista from "@/components/transportista";
import { useAuth } from "@/app/hooks/useAuth";
import { useGroups } from "@/app/hooks/useGroups";

export default function CitiesApp() {
  const { user, profile, loading: authLoading, login, register, logout } = useAuth();
  const {
    groups,
    activeGroup,
    activeGroupId,
    loading: groupsLoading,
    setActiveGroupId,
    createGroup,
    joinGroup,
  } = useGroups(user, profile);
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
        setInviteMessage("Te has unido al grupo de la invitación.");
        params.delete("invite");
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
        window.history.replaceState(null, "", nextUrl);
      })
      .catch((error) => {
        setInviteMessage(
          error instanceof Error ? error.message : "No se pudo aceptar la invitación."
        );
      });
  }, [joinGroup, user]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background p-4 text-center text-muted-foreground">
        Cargando...
      </main>
    );
  }

  if (!user) {
    return <AuthPanel onLogin={login} onRegister={register} />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_hsl(0_0%_3.9%),_hsl(220_18%_7%)_48%,_hsl(0_0%_3.9%))]">
      <GroupToolbar
        userEmail={user.email}
        playerName={profile?.playerName ?? user.displayName}
        server={profile?.server}
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={setActiveGroupId}
        onCreateGroup={createGroup}
        onLogout={logout}
      />
      <div className="container mx-auto max-w-6xl p-4">
      {inviteMessage ? (
        <p className="mb-4 rounded-md border border-border bg-card p-3 text-sm">
          {inviteMessage}
        </p>
      ) : null}
      {groupsLoading ? (
        <p className="text-center text-muted-foreground">Cargando grupos...</p>
      ) : null}
      {!groupsLoading && !activeGroupId ? (
        <p className="rounded-lg border border-white/10 bg-card p-4 text-sm text-muted-foreground">
          Crea un grupo para empezar a guardar tiempos compartidos.
        </p>
      ) : null}
      {activeGroupId ? (
        <Tabs defaultValue="los-santos">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg border border-white/10 bg-card p-1 shadow-lg shadow-black/20 sm:grid-cols-4">
            <TabsTrigger value="los-santos">Los Santos</TabsTrigger>
            <TabsTrigger value="san-fierro">San Fierro</TabsTrigger>
            <TabsTrigger value="las-venturas">Las Venturas</TabsTrigger>
            <TabsTrigger value="transportista">Transportista</TabsTrigger>
          </TabsList>
          <TabsContent value="los-santos" className="mt-5">
            <LosSantos groupId={activeGroupId} />
          </TabsContent>
          <TabsContent value="san-fierro" className="mt-5">
            <SanFierro groupId={activeGroupId} />
          </TabsContent>
          <TabsContent value="las-venturas" className="mt-5">
            <LasVenturas groupId={activeGroupId} />
          </TabsContent>
          <TabsContent value="transportista" className="mt-5">
            <Transportista groupId={activeGroupId} />
          </TabsContent>
        </Tabs>
      ) : null}
      </div>
    </main>
  );
}
