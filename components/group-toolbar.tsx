"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CopyIcon,
  Gamepad2Icon,
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  ServerIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { GroupSummary } from "@/app/hooks/useGroups";
import { Button } from "@/components/ui/button";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 2600);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

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
      setIsCreateOpen(false);
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

    try {
      await navigator.clipboard.writeText(inviteLink);
      setFeedback("Enlace copiado correctamente.");
    } catch {
      setFeedback("No se pudo copiar el enlace.");
    }
  };

  const handleOpenCreateGroup = () => {
    setIsMobileMenuOpen(false);
    setIsCreateOpen(true);
  };

  const handleSelectGroup = (groupId: string) => {
    onSelectGroup(groupId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await onLogout();
  };

  const handleCopyInviteAndClose = async () => {
    setIsMobileMenuOpen(false);
    await handleCopyInvite();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300">
              <UsersIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight">FenixZone Timers</h1>
              <div className="mt-1 hidden flex-wrap items-center gap-2 text-xs text-muted-foreground sm:flex">
                {playerName ? (
                  <span className="inline-flex items-center gap-1">
                    <Gamepad2Icon className="h-3.5 w-3.5 text-amber-300" />
                    {playerName}
                  </span>
                ) : null}
                {server ? (
                  <span className="inline-flex items-center gap-1">
                    <ServerIcon className="h-3.5 w-3.5 text-teal-300" />
                    {server}
                  </span>
                ) : null}
                {userEmail ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span className="truncate">{userEmail}</span>
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground sm:hidden">
                {activeGroup?.name ?? "Sin grupo"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir menu"
          >
            {isMobileMenuOpen ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </Button>

          <div className="hidden gap-2 lg:flex lg:items-center">
            <label className="relative inline-flex min-w-56 items-center">
              <select
                className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                value={activeGroup?.id ?? ""}
                onChange={(event) => handleSelectGroup(event.target.value)}
                disabled={groups.length === 0}
                aria-label="Seleccionar grupo"
              >
                {groups.length === 0 ? <option value="">Sin grupos</option> : null}
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
            </label>
            <Button type="button" variant="outline" onClick={handleOpenCreateGroup}>
              <PlusIcon className="h-4 w-4" />
              Grupo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyInviteAndClose}
              disabled={!activeGroup}
            >
              <CopyIcon className="h-4 w-4" />
              Invitacion
            </Button>
            <Button type="button" variant="ghost" onClick={handleLogout}>
              <LogOutIcon className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
        {isMobileMenuOpen ? (
          <div className="border-t border-white/10 px-4 pb-4 lg:hidden">
            <div className="mx-auto grid max-w-6xl gap-3 rounded-lg border border-white/10 bg-card p-3 shadow-xl shadow-black/20">
              <div className="grid gap-1 text-xs text-muted-foreground">
                {playerName ? (
                  <span className="inline-flex items-center gap-1">
                    <Gamepad2Icon className="h-3.5 w-3.5 text-amber-300" />
                    {playerName}
                  </span>
                ) : null}
                {server ? (
                  <span className="inline-flex items-center gap-1">
                    <ServerIcon className="h-3.5 w-3.5 text-teal-300" />
                    {server}
                  </span>
                ) : null}
                {userEmail ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span className="truncate">{userEmail}</span>
                  </span>
                ) : null}
              </div>
              <label className="relative inline-flex items-center">
                <select
                  className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                  value={activeGroup?.id ?? ""}
                  onChange={(event) => handleSelectGroup(event.target.value)}
                  disabled={groups.length === 0}
                  aria-label="Seleccionar grupo"
                >
                  {groups.length === 0 ? <option value="">Sin grupos</option> : null}
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={handleOpenCreateGroup}>
                  <PlusIcon className="h-4 w-4" />
                  Grupo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyInviteAndClose}
                  disabled={!activeGroup}
                >
                  <CopyIcon className="h-4 w-4" />
                  Invitacion
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="col-span-2"
                  onClick={handleLogout}
                >
                  <LogOutIcon className="h-4 w-4" />
                  Salir
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {feedback ? (
        <div className="fixed right-4 top-20 z-50 flex max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-2 duration-200 sm:right-6">
          <div className="flex items-center gap-3 rounded-lg border border-teal-300/25 bg-zinc-950/95 px-4 py-3 text-sm font-medium text-zinc-50 shadow-2xl shadow-black/40 backdrop-blur">
            <CheckCircle2Icon className="h-5 w-5 shrink-0 text-teal-300" />
            <span>{feedback}</span>
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-card shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h2 className="text-base font-semibold">Crear grupo</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Elige un nombre para compartir timers.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Cerrar modal"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <form className="space-y-4 p-4" onSubmit={handleCreateGroup}>
              <label className="block space-y-2 text-sm font-medium">
                <span>Nombre</span>
                <input
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  type="text"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Ej: Normal"
                  autoFocus
                  required
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <PlusIcon className="h-4 w-4" />
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
