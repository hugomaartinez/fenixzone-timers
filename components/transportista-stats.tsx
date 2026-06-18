"use client";

import { BarChart3Icon, MapPinIcon, TimerIcon } from "lucide-react";
import type { TransportistaTrip } from "@/app/hooks/useTransportista";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_TRIP_DURATION_MS = 10 * 60 * 1000;

interface TransportistaStatsProps {
  trips: TransportistaTrip[];
}

interface RouteStats {
  averageDurationMs: number;
  count: number;
  destination: string;
  key: string;
  origin: string;
}

function formatDuration(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getRouteStats(trips: TransportistaTrip[]) {
  const routes = new Map<
    string,
    { count: number; destination: string; durationMs: number; origin: string }
  >();

  trips.forEach((trip) => {
    const key = `${trip.origin}::${trip.destination}`;
    const current = routes.get(key) ?? {
      count: 0,
      destination: trip.destination,
      durationMs: 0,
      origin: trip.origin,
    };
    current.count += 1;
    current.durationMs += trip.durationMs;
    routes.set(key, current);
  });

  return [...routes.entries()]
    .map<RouteStats>(([key, route]) => ({
      averageDurationMs: Math.round(route.durationMs / route.count),
      count: route.count,
      destination: route.destination,
      key,
      origin: route.origin,
    }))
    .sort((a, b) => b.count - a.count || a.averageDurationMs - b.averageDurationMs);
}

function RouteName({ route }: { route: RouteStats }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{route.origin}</p>
      <p className="truncate text-xs text-muted-foreground">hasta {route.destination}</p>
    </div>
  );
}

export default function TransportistaStats({ trips }: TransportistaStatsProps) {
  const validTrips = trips.filter(
    (trip) =>
      trip.durationMs > 0 &&
      trip.durationMs <= MAX_TRIP_DURATION_MS &&
      trip.validDuration !== false
  );
  const routes = getRouteStats(validTrips);
  const maxCount = Math.max(...routes.map((route) => route.count), 1);
  const routesByDuration = [...routes].sort(
    (a, b) => a.averageDurationMs - b.averageDurationMs
  );

  return (
    <Card className="overflow-hidden rounded-lg border-white/10 bg-card shadow-lg shadow-black/20 lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-white/10 bg-white/[0.03] p-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3Icon className="h-5 w-5 text-teal-300" />
            Estadísticas de recorridos
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Solo se incluyen recorridos completados en 10 minutos o menos
          </p>
        </div>
        <span className="rounded-md bg-teal-400/10 px-2 py-1 text-xs text-teal-300">
          {validTrips.length} válido{validTrips.length === 1 ? "" : "s"}
        </span>
      </CardHeader>

      {routes.length === 0 ? (
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Aún no hay recorridos completos. Las estadísticas aparecerán cuando el agente detecte el origen, el destino y la entrega.
          </p>
        </CardContent>
      ) : (
        <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <MapPinIcon className="h-4 w-4 text-amber-300" />
              Rutas más frecuentes
            </h3>
            <div className="space-y-4">
              {routes.slice(0, 8).map((route) => (
                <div key={route.key}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <RouteName route={route} />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {route.count} recorrido{route.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-teal-400"
                      style={{ width: `${Math.max(6, (route.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <TimerIcon className="h-4 w-4 text-emerald-300" />
              Duración media por ruta
            </h3>
            <div className="divide-y divide-white/10 rounded-md border border-white/10 bg-background">
              {routesByDuration.slice(0, 8).map((route) => (
                <div className="flex items-center justify-between gap-4 px-3 py-3" key={route.key}>
                  <RouteName route={route} />
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-emerald-300">
                      {formatDuration(route.averageDurationMs)}
                    </p>
                    <p className="text-xs text-muted-foreground">media</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      )}
    </Card>
  );
}
