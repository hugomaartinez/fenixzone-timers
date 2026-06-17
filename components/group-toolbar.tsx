"use client";

import { FormEvent, useMemo, useState } from "react";
import { CopyIcon, LogOutIcon, PlusIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupSummary } from "@/app/hooks/useGroups";

interface GroupToolbarProps {
  userEmail: string | null;
  groups: GroupSummary[];
  activeGroup: GroupSummary | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<unknown>;
  onLogout: () => Promise<unknown>;
}

export default function GroupToolbar({
  userEmail,
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
    <section className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">FenixZone Timers</h1>
          {userEmail ? (
            <span className="text-sm text-muted-foreground">{userEmail}</span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm outline-none"
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
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleCreateGroup}>
        <input
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none"
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
    </section>
  );
}
