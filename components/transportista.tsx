"use client";

import { useEffect, useState } from "react";
import {
  ActivityIcon,
  ClockIcon,
  RadioIcon,
  TimerResetIcon,
  TruckIcon,
  WifiIcon,
} from "lucide-react";
import { useTransportista } from "@/app/hooks/useTransportista";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import TransportistaStats from "@/components/transportista-stats";

interface TransportistaProps {
  groupId: string;
}

function formatDuration(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const minutes = Math.floor(safeMilliseconds / 60000);
  const seconds = Math.floor((safeMilliseconds % 60000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatTime(timestamp: number | null) {
  if (!timestamp) {
    return "Sin datos";
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export default function Transportista({ groupId }: TransportistaProps) {
  const [now, setNow] = useState(Date.now());
  const {
    agents,
    averageIntervalMs,
    events,
    fallbackIntervalMs,
    lastEvent,
    loading,
    nextCallAt,
    realisticIntervalsCount,
    trips,
  } = useTransportista(groupId);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const onlineAgents = agents.filter(
    (agent) => agent.lastSeenAt && now - agent.lastSeenAt < 45000 && agent.running !== false
  );
  const agentOnline = onlineAgents.length > 0;
  const lastRejectedAgent = agents.find((agent) => agent.lastRejectedAt);
  const estimatedNextCallAt =
    lastEvent && nextCallAt
      ? nextCallAt + Math.max(0, Math.ceil((now - nextCallAt) / averageIntervalMs)) * averageIntervalMs
      : null;
  const remainingMs = estimatedNextCallAt ? estimatedNextCallAt - now : fallbackIntervalMs;
  const recentEvents = [...events].reverse().slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden rounded-lg border-white/10 bg-card shadow-lg shadow-black/20">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-white/10 bg-white/[0.03] p-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TruckIcon className="h-5 w-5 text-teal-300" />
              Transportista
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimación basada en llamadas reales
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
              agentOnline
                ? "bg-teal-400/10 text-teal-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            <RadioIcon className="h-3.5 w-3.5" />
            {agentOnline
              ? `${onlineAgents.length} agente${onlineAgents.length === 1 ? "" : "s"} activo${onlineAgents.length === 1 ? "" : "s"}`
              : "Sin agente"}
          </span>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4 text-amber-300" />
              Última llamada
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {formatTime(lastEvent?.calledAt ?? null)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <TimerResetIcon className="h-4 w-4 text-teal-300" />
              Próxima llamada
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {estimatedNextCallAt
                ? formatDuration(remainingMs)
                : formatDuration(fallbackIntervalMs)}
            </p>
            {lastEvent && estimatedNextCallAt && estimatedNextCallAt !== nextCallAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                (Estimación)
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-white/10 bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ActivityIcon className="h-4 w-4 text-emerald-300" />
              Media real
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {formatDuration(averageIntervalMs)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {realisticIntervalsCount > 0
                ? `${realisticIntervalsCount} intervalos válidos`
                : "Usando valor por defecto"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-lg border-white/10 bg-card shadow-lg shadow-black/20">
        <CardHeader className="border-b border-white/10 bg-white/[0.03] p-4">
          <CardTitle className="text-base">Historial reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando llamadas...</p>
          ) : null}
          {!loading && recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay llamadas registradas.
            </p>
          ) : null}
          {recentEvents.map((event) => (
            <div
              className="flex items-center justify-between rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
              key={event.id}
            >
              <span>{formatTime(event.calledAt)}</span>
              <span className="text-muted-foreground">
                {event.intervalMs ? formatDuration(event.intervalMs) : "Inicial"}
              </span>
            </div>
          ))}
          {lastRejectedAgent?.lastRejectedAt ? (
            <p className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2 text-xs text-muted-foreground">
              Último descarte: {formatTime(lastRejectedAgent.lastRejectedAt)}
              {lastRejectedAgent.lastRejectedIntervalMs
                ? ` (${formatDuration(lastRejectedAgent.lastRejectedIntervalMs)})`
                : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <TransportistaStats trips={trips} />

      <Card className="overflow-hidden rounded-lg border-white/10 bg-card shadow-lg shadow-black/20 lg:col-span-2">
        <CardHeader className="border-b border-white/10 bg-white/[0.03] p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <WifiIcon className="h-5 w-5 text-teal-300" />
            Agentes conectados
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay agentes registrados.</p>
          ) : null}
          {agents.map((agent) => {
            const online =
              Boolean(agent.lastSeenAt) &&
              now - Number(agent.lastSeenAt) < 45000 &&
              agent.running !== false;

            return (
              <div
                className="rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
                key={agent.agentId ?? agent.agentName ?? agent.lastSeenAt}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {agent.agentName ?? "Agente sin nombre"}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded px-2 py-0.5 text-xs",
                      online
                        ? "bg-teal-400/10 text-teal-300"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última señal: {formatTime(agent.lastSeenAt ?? null)}
                </p>
                {agent.lastRejectedAt ? (
                  <p className="mt-1 text-xs text-amber-300">
                    Descarte: {formatTime(agent.lastRejectedAt)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
