"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CopyIcon,
  Gamepad2Icon,
  LogOutIcon,
  PlusIcon,
  ServerIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupSummary } from "@/app/hooks/useGroups";

interface GroupToolbarProps {
  userEmail: string | null;
  playerName?: string | null;
  server?: string | null;
  groups: GroupSummary[];
  activeGroup: GroupSummary | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<unknown>;
  onLogout: () => Promise<unknown>;
}

export default function GroupToolbar({
  userEmail,
  playerName,
  server,
  groups,
  activeGroup,
  onSelectGroup,
  onCreateGroup,
  onLogout,
}: GroupToolbarProps) {
  const [groupName, setGroupName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inviteLink = useMemo(() => {
    if (!activeGroup || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${window.location.pathname}?invite=${activeGroup.id}`;
  }, [activeGroup]);

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      await onCreateGroup(groupName);
      setGroupName("");
      setFeedback("Grupo creado.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo crear el grupo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setFeedback("Enlace copiado.");
  };

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-card shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300">
              <UsersIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold leading-tight">FenixZone Timers</h1>
              {activeGroup ? (
                <p className="text-sm text-muted-foreground">
                  Grupo activo: <span className="text-foreground">{activeGroup.name}</span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {playerName ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-background px-2.5 py-1.5">
                <Gamepad2Icon className="h-3.5 w-3.5 text-amber-300" />
                {playerName}
              </span>
            ) : null}
            {server ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-background px-2.5 py-1.5">
                <ServerIcon className="h-3.5 w-3.5 text-teal-300" />
                {server}
              </span>
            ) : null}
          {userEmail ? (
              <span className="inline-flex items-center rounded-md border border-white/10 bg-background px-2.5 py-1.5">
                {userEmail}
              </span>
          ) : null}
          </div>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleCreateGroup}>
          <input
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Nombre del grupo"
            required
          />
          <Button type="submit" disabled={loading}>
            <PlusIcon className="h-4 w-4" />
            Crear grupo
          </Button>
        </form>
      </div>
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={activeGroup?.id ?? ""}
            onChange={(event) => onSelectGroup(event.target.value)}
            disabled={groups.length === 0}
          >
            {groups.length === 0 ? <option value="">Sin grupos</option> : null}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyInvite}
            disabled={!activeGroup}
          >
            <CopyIcon className="h-4 w-4" />
            Copiar invitacion
          </Button>
          <Button type="button" variant="ghost" onClick={onLogout}>
            <LogOutIcon className="h-4 w-4" />
            Salir
          </Button>
        </div>
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      </div>
    </section>
  );
}
